
import React, { useState, useCallback } from "react";
import { Upload, X, AlertCircle, Zap, Star, Brain, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  compressImages, 
  shouldCompressFile, 
  formatFileSize, 
  isValidImageType,
  estimateCompressionSavings 
} from "@/utils/imageCompression";
import { propertyImageService, PropertyImageUpload } from "@/services/propertyImageService";
import { ImageAltTextContext, imageAltTextGenerator } from "@/services/ai/imageAltText";
import { normalizeImageUrl } from "@/utils/imageUrl";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableImageItemProps {
  id: string;
  image: string;
  index: number;
  thumbnailIndex: number;
  onThumbnailChange?: (index: number) => void;
  onRemove: (index: number) => void;
  onGenerateAltText?: (index: number) => void;
  isGeneratingAltText: boolean;
  isAdmin: boolean;
}

const SortableImageItem = ({
  id,
  image,
  index,
  thumbnailIndex,
  onThumbnailChange,
  onRemove,
  onGenerateAltText,
  isGeneratingAltText,
  isAdmin,
}: SortableImageItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const setThumbnail = (index: number) => {
    if (onThumbnailChange) {
      onThumbnailChange(index);
      toast.success(`Image ${index + 1} set as thumbnail`);
    }
  };

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={`relative group overflow-hidden transition-all duration-200 h-32 ${
        index === thumbnailIndex 
          ? 'ring-2 ring-blue-500 ring-offset-2' 
          : ''
      }`}
    >
      {/* Drag Handle - Center of image */}
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 z-10 cursor-move"
        title="Drag to reorder"
      >
        <img
          src={normalizeImageUrl(image)}
          alt={`Upload ${index + 1}`}
          className="w-full h-32 object-cover pointer-events-none"
          loading="lazy"
          onError={(e) => {
            console.error('Image failed to load:', image);
            console.error('Normalized URL was:', normalizeImageUrl(image));
            // Fallback to placeholder if image fails to load
            e.currentTarget.src = '/placeholder.svg';
            // Also log the original image URL for debugging
            console.error('Original image URL:', image);
          }}
        />
      </div>
      
      {/* Thumbnail Selection Zone - Top Left (above drag layer) */}
      {onThumbnailChange && (
        <div className="absolute top-0 left-0 w-10 h-10 z-20">
          {index === thumbnailIndex ? (
            // Current thumbnail indicator
            <div className="w-full h-full bg-blue-500 text-white flex items-center justify-center rounded-br-lg pointer-events-none">
              <Star className="h-4 w-4 fill-current" />
            </div>
          ) : (
            // Clickable thumbnail selector
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setThumbnail(index);
              }}
              className="w-full h-full bg-black bg-opacity-0 hover:bg-opacity-60 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center rounded-br-lg"
              title="Set as thumbnail"
            >
              <Star className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </button>
          )}
        </div>
      )}
      
      {/* Image Number Badge (above drag layer) */}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded z-20">
        {index + 1}
      </div>
      
      {/* Remove Button - Top Right (above drag layer) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onRemove(index);
        }}
        className="absolute top-0 right-0 w-8 h-8 bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center rounded-bl-lg z-20"
        title="Remove image"
      >
        <X size={14} />
      </button>

      {/* Admin-only AI Alt Text Zone - Bottom Right (above drag layer) */}
      {isAdmin && onGenerateAltText && (
        <div className="absolute bottom-0 right-0 w-12 h-10 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onGenerateAltText(index);
            }}
            disabled={isGeneratingAltText}
            className="w-full h-full bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white transition-all duration-200 flex items-center justify-center rounded-tl-lg"
            title="Generate AI description"
          >
            {isGeneratingAltText ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
            ) : (
              <Brain size={14} />
            )}
          </button>
        </div>
      )}
    </Card>
  );
};

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  thumbnailIndex?: number;
  onThumbnailChange?: (index: number) => void;
  maxImages?: number;
  listingId?: string; // For admin AI alt text generation
  propertyContext?: ImageAltTextContext; // Property info for AI alt text generation
}

export const ImageUploader = ({ 
  images, 
  onImagesChange, 
  thumbnailIndex = 0, 
  onThumbnailChange, 
  maxImages = Infinity,
  listingId,
  propertyContext
}: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState({ current: 0, total: 0 });
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [generatingAltText, setGeneratingAltText] = useState(false);
  const [altTextProgress, setAltTextProgress] = useState({ current: 0, total: 0 });
  const [generatingImageAltText, setGeneratingImageAltText] = useState<Set<number>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const { user, isAdmin } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      
      if (imageFiles.length !== files.length) {
        toast.error("Only image files are allowed");
      }
      
      if (imageFiles.length > 0) {
        await uploadImages(imageFiles);
      }
    }
  }, [images, maxImages, user]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      
      if (imageFiles.length !== files.length) {
        toast.error("Only image files are allowed");
      }
      
      if (imageFiles.length > 0) {
        await uploadImages(imageFiles);
      }
    }
  };

  const uploadImages = async (files: File[]) => {
    if (!user) {
      toast.error("Please log in to upload images");
      return;
    }

    if (maxImages !== Infinity && images.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Validate files first
    const validFiles: File[] = [];
    for (const file of files) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
        continue;
      }

      if (!isValidImageType(file)) {
        toast.error(`File ${file.name} has an unsupported format. Use JPG, PNG, WEBP, or GIF.`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    try {
      // Step 1: Compress images
      setCompressing(true);
      setCompressionProgress({ current: 0, total: validFiles.length });

      const compressionResults = await compressImages(
        validFiles,
        (current, total) => setCompressionProgress({ current, total })
      );

      // Show compression summary
      const totalOriginalSize = compressionResults.reduce((sum, result) => sum + result.originalSize, 0);
      const totalCompressedSize = compressionResults.reduce((sum, result) => sum + result.compressedSize, 0);
      const overallReduction = Math.round((1 - totalCompressedSize / totalOriginalSize) * 100);

      if (overallReduction > 10) {
        toast.success(
          `Images compressed: ${formatFileSize(totalOriginalSize)} → ${formatFileSize(totalCompressedSize)} (${overallReduction}% smaller)`,
          { duration: 3000 }
        );
      }

      setCompressing(false);

      // Step 2: Upload compressed images
      setUploading(true);
      setUploadProgress({ current: 0, total: compressionResults.length });
      const newImages: string[] = [];

      for (let i = 0; i < compressionResults.length; i++) {
        const result = compressionResults[i];
        const originalFile = validFiles[i];
        
        if (result.error) {
          console.warn(`Compression failed for ${originalFile.name}, using original:`, result.error);
        }

        // Determine file extension for compressed file
        const compressedFile = result.compressedFile;
        let fileExt = compressedFile.type.split('/')[1];
        if (fileExt === 'jpeg') fileExt = 'jpg';

        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        console.log(`Uploading ${result.error ? 'original' : 'compressed'} file:`, fileName, 
                   `Size: ${formatFileSize(compressedFile.size)}`);
        
        const { error: uploadError } = await supabase.storage
          .from('property_images')
          .upload(fileName, compressedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Failed to upload ${originalFile.name}: ${uploadError.message}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('property_images')
          .getPublicUrl(fileName);

        if (urlData?.publicUrl) {
          console.log('Generated public URL for', fileName, ':', urlData.publicUrl);
          newImages.push(urlData.publicUrl);
          console.log('Successfully uploaded:', urlData.publicUrl);
        } else {
          console.error('Failed to get public URL for:', fileName);
        }

        // Update upload progress
        setUploadProgress({ current: i + 1, total: compressionResults.length });
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
        toast.success(`Successfully uploaded ${newImages.length} optimized image(s)`);
      }
    } catch (error) {
      console.error("Error processing images:", error);
      toast.error("Failed to process images. Please try again.");
    } finally {
      setCompressing(false);
      setUploading(false);
      setCompressionProgress({ current: 0, total: 0 });
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    
    // Update thumbnail index if necessary
    if (onThumbnailChange) {
      if (index === thumbnailIndex) {
        // If removing the current thumbnail, set the first image as thumbnail
        onThumbnailChange(0);
      } else if (index < thumbnailIndex) {
        // If removing an image before the current thumbnail, shift the index
        onThumbnailChange(thumbnailIndex - 1);
      }
    }
  };

  const setThumbnail = (index: number) => {
    if (onThumbnailChange) {
      onThumbnailChange(index);
      toast.success(`Image ${index + 1} set as thumbnail`);
    }
  };

  // Admin-only function to generate AI alt text for a single image
  const generateSingleImageAltText = async (imageIndex: number) => {
    if (!isAdmin) {
      toast.error("AI alt text generation is only available for admins");
      return;
    }

    const imageUrl = images[imageIndex];
    if (!imageUrl) {
      toast.error("Image not found");
      return;
    }

    setGeneratingImageAltText(prev => new Set(prev).add(imageIndex));

    try {
      // Create a basic property context if not provided
      const basicContext: ImageAltTextContext = propertyContext || {
        propertyType: "rental property",
        propertyLocation: "listing",
        bedrooms: 1,
        bathrooms: 1,
        price: 0,
        amenities: []
      };

      const context = {
        ...basicContext,
        imageIndex: imageIndex,
        totalImages: images.length
      };

      // Generate alt text for the specific image
      const result = await imageAltTextGenerator.generateAltText(imageUrl, context);
      
      if (result && result.altText) {
        toast.success(`Generated AI description for image ${imageIndex + 1}: "${result.altText.substring(0, 50)}..."`);
        
        // If we have a listing ID, save to database
        if (listingId && result.altText) {
          // Find or create property image record
          const { data: existingImage } = await supabase
            .from('property_images')
            .select('id')
            .eq('listing_id', listingId)
            .eq('image_url', imageUrl)
            .single();

          if (existingImage) {
            // Update existing record
            await supabase
              .from('property_images')
              .update({
                alt_text: result.altText,
                generated_by: result.generatedBy,
                confidence_score: result.confidenceScore,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingImage.id);
          } else {
            // Create new record
            await supabase
              .from('property_images')
              .insert({
                listing_id: listingId,
                image_url: imageUrl,
                alt_text: result.altText,
                image_order: imageIndex,
                is_thumbnail: imageIndex === 0,
                generated_by: result.generatedBy,
                confidence_score: result.confidenceScore
              });
          }
        }
      }
      
    } catch (error) {
      console.error('Error generating AI alt text for image:', imageIndex, error);
      toast.error(`Failed to generate AI description for image ${imageIndex + 1}`);
    } finally {
      setGeneratingImageAltText(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageIndex);
        return newSet;
      });
    }
  };

  // Admin-only function to generate AI alt text for existing images
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      // Extract index from the ID format: "image-{hash}-{index}"
      const getIndexFromId = (id: string) => {
        const parts = id.split('-');
        return parseInt(parts[parts.length - 1]);
      };
      
      const oldIndex = getIndexFromId(active.id as string);
      const newIndex = getIndexFromId(over.id as string);
      
      if (!isNaN(oldIndex) && !isNaN(newIndex) && oldIndex !== newIndex) {
        const newImages = arrayMove(images, oldIndex, newIndex);
        onImagesChange(newImages);
        
        // Update thumbnail index if necessary
        if (onThumbnailChange) {
          if (oldIndex === thumbnailIndex) {
            // If the thumbnail image was moved, update to new position
            onThumbnailChange(newIndex);
          } else if (oldIndex < thumbnailIndex && newIndex >= thumbnailIndex) {
            // Image moved from before thumbnail to after or at thumbnail position
            onThumbnailChange(thumbnailIndex - 1);
          } else if (oldIndex > thumbnailIndex && newIndex <= thumbnailIndex) {
            // Image moved from after thumbnail to before or at thumbnail position
            onThumbnailChange(thumbnailIndex + 1);
          }
        }
        
        toast.success('Images reordered successfully');
      }
    }
  };

  const generateAiAltText = async () => {
    if (!isAdmin || !listingId || !propertyContext) {
      toast.error("AI alt text generation is only available for admins");
      return;
    }

    if (images.length === 0) {
      toast.error("No images to generate descriptions for");
      return;
    }

    setGeneratingAltText(true);
    setAltTextProgress({ current: 0, total: images.length });

    try {
      // Generate alt text for each image
      for (let i = 0; i < images.length; i++) {
        setAltTextProgress({ current: i, total: images.length });
        
        const context = {
          ...propertyContext,
          imageIndex: i,
          totalImages: images.length
        };

        // Generate alt text for the image URL
        await imageAltTextGenerator.generateAltText(images[i], context);
        
        // Add delay to avoid rate limits
        if (i < images.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      setAltTextProgress({ current: images.length, total: images.length });
      toast.success(`Generated AI descriptions for ${images.length} images!`);
      
    } catch (error) {
      console.error('Error generating AI alt text:', error);
      toast.error("Failed to generate AI descriptions. Please try again.");
    } finally {
      setGeneratingAltText(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="image-upload"
          disabled={uploading || compressing || generatingAltText || (maxImages !== Infinity && images.length >= maxImages)}
        />
        
        <label 
          htmlFor="image-upload" 
          className={`cursor-pointer ${uploading || compressing || generatingAltText || (maxImages !== Infinity && images.length >= maxImages) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {compressing ? (
            <div className="flex items-center justify-center">
              <Zap className="h-6 w-6 text-orange-500 animate-pulse mr-2" />
              <div className="flex flex-col items-center">
                <span className="text-orange-600 font-medium">Compressing images...</span>
                <span className="text-sm text-gray-500">
                  {compressionProgress.current} of {compressionProgress.total} complete
                </span>
              </div>
            </div>
          ) : uploading ? (
            <div className="flex flex-col items-center space-y-3">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
                <span className="text-blue-600">Uploading optimized images...</span>
              </div>
              <div className="w-full max-w-xs">
                <Progress 
                  value={uploadProgress.total > 0 ? (uploadProgress.current / uploadProgress.total) * 100 : 0} 
                  className="h-2"
                />
                <div className="text-xs text-gray-500 mt-1 text-center">
                  {uploadProgress.current} of {uploadProgress.total} uploaded
                </div>
              </div>
            </div>
          ) : generatingAltText ? (
            <div className="flex flex-col items-center space-y-3">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mr-2"></div>
                <span className="text-green-600">Generating AI descriptions...</span>
              </div>
              <div className="w-full max-w-xs">
                <Progress 
                  value={altTextProgress.total > 0 ? (altTextProgress.current / altTextProgress.total) * 100 : 0} 
                  className="h-2"
                />
                <div className="text-xs text-gray-500 mt-1 text-center">
                  {altTextProgress.current} of {altTextProgress.total} described
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="flex items-center mb-2">
                <Upload className="h-8 w-8 text-gray-400" />
                <Zap className="h-4 w-4 text-orange-500 ml-1" />
              </div>
              <span className="text-gray-600">
                {maxImages !== Infinity && images.length >= maxImages 
                  ? `Maximum ${maxImages} images reached`
                  : 'Click to upload or drag and drop images'
                }
              </span>
              <span className="text-sm text-gray-400">
                PNG, JPG, WEBP, GIF up to 10MB each
              </span>
              <span className="text-xs text-orange-600 font-medium mt-1">
                Auto-compressed for faster uploads
              </span>
              {isAdmin && (
                <span className="text-xs text-green-600 font-medium">
                  ✨ Auto-descriptions available (Admin)
                </span>
              )}
            </div>
          )}
        </label>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="space-y-4">
          {/* Image Controls Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-start gap-4 text-sm text-gray-700">
              <div className="flex items-center">
                <GripVertical className="h-4 w-4 mr-2 text-gray-500" />
                <span>
                  <span className="font-medium">Drag to reorder:</span> Hold and drag images
                  <span className="block text-xs text-gray-500">Drag handle appears on hover</span>
                </span>
              </div>
              {onThumbnailChange && (
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-2 text-blue-500" />
                  <span>
                    <span className="font-medium">Thumbnail:</span> Image {thumbnailIndex + 1}
                    <span className="block text-xs text-gray-500">Click ⭐ corner to change</span>
                  </span>
                </div>
              )}
              {isAdmin && (
                <div className="flex items-center">
                  <Brain className="h-4 w-4 mr-2 text-green-500" />
                  <span>
                    <span className="font-medium">AI Descriptions:</span> Click 🧠 button
                    <span className="block text-xs text-gray-500">Generate SEO alt text</span>
                  </span>
                </div>
              )}
              <div className="flex items-center">
                <X className="h-4 w-4 mr-2 text-red-500" />
                <span>
                  <span className="font-medium">Remove:</span> Click ✕ corner
                  <span className="block text-xs text-gray-500">Delete image</span>
                </span>
              </div>
            </div>
          </div>
          
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={images.map((image, index) => `image-${btoa(image).slice(0, 8)}-${index}`)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => {
                  const imageId = `image-${btoa(image).slice(0, 8)}-${index}`;
                  return (
                    <SortableImageItem
                      key={imageId}
                      id={imageId}
                      image={image}
                      index={index}
                      thumbnailIndex={thumbnailIndex}
                      onThumbnailChange={onThumbnailChange}
                      onRemove={removeImage}
                      onGenerateAltText={isAdmin ? generateSingleImageAltText : undefined}
                      isGeneratingAltText={generatingImageAltText.has(index)}
                      isAdmin={isAdmin}
                    />
                  );
                })}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeId ? (
                <div className="opacity-80">
                  <Card className="relative group overflow-hidden">
                    <img
                      src={normalizeImageUrl(images[parseInt(activeId.split('-')[activeId.split('-').length - 1])])}
                      alt="Dragging"
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-2 border-blue-500 border-dashed" />
                  </Card>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {/* Admin-only AI Alt Text Generation Button */}
          {isAdmin && listingId && propertyContext && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-green-600" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">AI Image Descriptions</h4>
                    <p className="text-xs text-gray-500">Generate SEO-optimized alt text for accessibility</p>
                  </div>
                </div>
                <Button
                  onClick={generateAiAltText}
                  disabled={generatingAltText || images.length === 0}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Brain className={`h-4 w-4 ${generatingAltText ? 'animate-pulse' : ''}`} />
                  <span>
                    {generatingAltText ? 'Generating...' : 'Auto-Generate Descriptions'}
                  </span>
                </Button>
              </div>
              
              {generatingAltText && (
                <div className="mt-3">
                  <Progress 
                    value={altTextProgress.total > 0 ? (altTextProgress.current / altTextProgress.total) * 100 : 0} 
                    className="h-2"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Analyzing image {altTextProgress.current + 1} of {altTextProgress.total}...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {images.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No images uploaded yet</p>
          <p className="text-sm">Add some photos to make your listing more attractive</p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
