import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play, AlertCircle, ExternalLink, ZoomIn } from "lucide-react";
import VideoEmbed from "./VideoEmbed";
import { ImageModal } from "@/components/ui/image-modal";
import { supabase } from "@/integrations/supabase/client";

// Cache for processed image URLs to avoid repeated calls
const IMAGE_URL_CACHE = new Map<string, string>();

interface PropertyImageGalleryProps {
  images: string[];
  mainImage: string;
  title: string;
  featured?: boolean;
  youtube_url?: string;
  video_id?: string;
  is_short?: boolean;
}

const PropertyImageGallery = ({ 
  images, 
  mainImage, 
  title, 
  featured, 
  youtube_url, 
  video_id,
  is_short = false
}: PropertyImageGalleryProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [videoError, setVideoError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const preloadCache = useRef<Map<string, HTMLImageElement>>(new Map());
  
  
  // Process and validate images - get URLs from property_images bucket
  const processImageUrl = (imgPath: string): string => {
    if (!imgPath || typeof imgPath !== 'string') return '/placeholder.svg';
    
    const trimmed = imgPath.trim();
    
    // Skip invalid URLs including blob URLs
    if (trimmed === '' ||
        trimmed === '/placeholder.svg' ||
        trimmed === 'placeholder.svg' ||
        trimmed.includes('undefined') ||
        trimmed.includes('null') ||
        trimmed.startsWith('blob:')) {
      return '/placeholder.svg';
    }
    
    // If it's already a full URL, return as is
    if (trimmed.startsWith('http')) {
      return trimmed;
    }
    
    // Check cache first to avoid repeated API calls
    if (IMAGE_URL_CACHE.has(trimmed)) {
      return IMAGE_URL_CACHE.get(trimmed)!;
    }
    
    // Handle different path formats
    // If path already includes a folder (UUID/filename), use it as-is
    // Otherwise, assume it's just a filename
    let storagePath = trimmed;
    
    // Check if this looks like a UUID folder path (e.g., "uuid/filename")
    const hasFolder = trimmed.includes('/') && 
                     trimmed.split('/')[0].match(/^[a-f0-9-]{36}$/i);
    
    // Get public URL from property_images bucket
    // The path should already include any folder structure
    const { data } = supabase.storage
      .from('property_images')
      .getPublicUrl(storagePath);
    
    // Cache the result
    const publicUrl = data.publicUrl;
    IMAGE_URL_CACHE.set(trimmed, publicUrl);
    
    return publicUrl;
  };
  
  // Cache processed media items to avoid recalculating URLs
  const mediaItems = useMemo(() => {
    const items = [];
    
    // Add processed images
    if (images && images.length > 0) {
      images.forEach(image => {
        const processedUrl = processImageUrl(image);
        if (processedUrl !== '/placeholder.svg') {
          items.push({ type: 'image', src: processedUrl });
        }
      });
    } else if (mainImage && mainImage !== '/placeholder.svg') {
      const processedUrl = processImageUrl(mainImage);
      if (processedUrl !== '/placeholder.svg') {
        items.push({ type: 'image', src: processedUrl });
      }
    }
    
    // Add YouTube video using new video_id field (preferred) or fallback to youtube_url
    if (video_id) {
      items.push({ 
        type: 'youtube_new', 
        id: video_id, 
        isShort: is_short || false 
      });
    } else if (youtube_url) {
      // Legacy support for old youtube_url field
      items.push({ type: 'youtube', src: youtube_url });
    }
    
    // Fallback to placeholder if no media
    if (items.length === 0) {
      items.push({ type: 'image', src: '/placeholder.svg' });
    }
    
    return items;
  }, [images, mainImage, video_id, youtube_url, is_short]);

  const currentMedia = mediaItems[currentImageIndex];
  
  // Preload adjacent images for instant navigation
  const preloadImage = useCallback((url: string, priority: 'high' | 'low' = 'low'): Promise<void> => {
    return new Promise((resolve) => {
      // Check if already loaded
      if (loadedImages.has(url) || preloadCache.current.has(url)) {
        resolve();
        return;
      }
      
      const img = new Image();
      // Set fetch priority for better performance
      if ('fetchPriority' in img) {
        (img as any).fetchPriority = priority;
      }
      img.onload = () => {
        preloadCache.current.set(url, img);
        setLoadedImages(prev => new Set(prev).add(url));
        resolve();
      };
      img.onerror = () => resolve();
      img.src = url;
    });
  }, [loadedImages]);
  
  // Preload current and adjacent images with high priority
  useEffect(() => {
    const preloadAdjacent = async () => {
      // Current image - highest priority
      if (currentMedia?.type === 'image' && currentMedia.src) {
        await preloadImage(currentMedia.src, 'high');
      }
      
      // Next and previous images - high priority for instant switching
      const nextIndex = (currentImageIndex + 1) % mediaItems.length;
      const nextMedia = mediaItems[nextIndex];
      
      const prevIndex = currentImageIndex === 0 ? mediaItems.length - 1 : currentImageIndex - 1;
      const prevMedia = mediaItems[prevIndex];
      
      // Load next and previous in parallel with high priority
      const adjacentPromises = [];
      if (nextMedia?.type === 'image' && nextMedia.src) {
        adjacentPromises.push(preloadImage(nextMedia.src, 'high'));
      }
      if (prevMedia?.type === 'image' && prevMedia.src) {
        adjacentPromises.push(preloadImage(prevMedia.src, 'high'));
      }
      
      await Promise.all(adjacentPromises);
    };
    
    preloadAdjacent();
  }, [currentImageIndex, mediaItems, currentMedia, preloadImage]);
  
  // Smart batched preloading to avoid overwhelming the browser
  useEffect(() => {
    let cancelled = false;
    
    const preloadBatched = async () => {
      const imageItems = mediaItems.filter(item => item.type === 'image' && item.src);
      
      // First batch: Preload first 3 images immediately (high priority)
      const firstBatch = imageItems.slice(0, 3);
      if (firstBatch.length > 0 && !cancelled) {
        await Promise.all(firstBatch.map(item => preloadImage(item.src, 'high')));
      }
      
      // Second batch: Next 2 images with small delay
      const secondBatch = imageItems.slice(3, 5);
      if (secondBatch.length > 0 && !cancelled) {
        await new Promise(resolve => setTimeout(resolve, 100));
        await Promise.all(secondBatch.map(item => preloadImage(item.src)));
      }
      
      // Remaining images: Load in batches of 3 with delays
      // Only preload up to image 15 to avoid overloading
      const maxPreload = Math.min(15, imageItems.length);
      for (let i = 5; i < maxPreload && !cancelled; i += 3) {
        const batch = imageItems.slice(i, Math.min(i + 3, maxPreload));
        if (batch.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 200)); // Breathing room
          await Promise.all(batch.map(item => preloadImage(item.src, 'low')));
        }
      }
      
      // Images beyond 15 will be loaded on-demand when user navigates to them
    };
    
    preloadBatched();
    
    // Cleanup function to stop preloading if component unmounts
    return () => {
      cancelled = true;
    };
  }, [mediaItems, preloadImage]);

  const handleNextImage = useCallback(() => {
    setCurrentImageIndex((prevIndex) => 
      (prevIndex + 1) % mediaItems.length
    );
  }, [mediaItems.length]);

  const handlePrevImage = useCallback(() => {
    setCurrentImageIndex((prevIndex) => 
      (prevIndex - 1 + mediaItems.length) % mediaItems.length
    );
  }, [mediaItems.length]);

  const handleImageError = (index: number) => {
    console.error('Gallery image failed to load:', mediaItems[index]?.src);
    setImageErrors(prev => new Set(prev).add(index));
  };

  const extractYouTubeId = (url: string): string => {
    const regex = /(?:youtube\.com\/.*v=|youtu\.be\/)([\w-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : '';
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    if (mediaItems.length <= 1) return; // Only enable swipe if multiple images

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNextImage();
    } else if (isRightSwipe) {
      handlePrevImage();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const renderMedia = () => {
    if (currentMedia.type === 'youtube_new') {
      return (
        <div className="relative w-full h-full">
          <VideoEmbed 
            id={currentMedia.id} 
            isShort={currentMedia.isShort}
            title={`${title} - Video Tour`}
            className="w-full h-full"
          />
        </div>
      );
    } else if (currentMedia.type === 'youtube') {
      const videoId = extractYouTubeId(currentMedia.src);
      if (!videoId) {
        return (
          <div className="relative w-full h-full bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <AlertCircle className="mx-auto mb-2 h-8 w-8" />
              <p>Invalid YouTube URL</p>
            </div>
          </div>
        );
      }
      
      return (
        <div className="relative w-full h-full">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?controls=1&modestbranding=1&rel=0`}
            title={`${title} - Video Tour`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full rounded-t-xl"
            onError={() => setVideoError(true)}
          />
          {!videoError && (
            <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
              <Play size={12} />
              Video Tour
            </div>
          )}
          {videoError && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-t-xl">
              <div className="text-center">
                <AlertCircle className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                <p className="text-gray-600 mb-2">Video unavailable</p>
                <Button
                  onClick={() => window.open(currentMedia.src, '_blank')}
                  variant="outline"
                  size="sm"
                  className="inline-flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Watch on YouTube
                </Button>
              </div>
            </div>
          )}
        </div>
      );
    } else {
      // Handle image errors by showing placeholder
      if (imageErrors.has(currentImageIndex)) {
        return (
          <div className="relative w-full h-full bg-gray-100 rounded-t-xl flex items-center justify-center">
            <img 
              src="/placeholder.svg"
              alt={title}
              className="w-full h-full object-contain rounded-t-xl"
            />
          </div>
        );
      }

      return (
        <div 
          className="relative w-full h-full bg-gray-100 rounded-t-xl flex items-center justify-center group cursor-pointer"
          onClick={() => setIsModalOpen(true)}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          <img 
            src={currentMedia.src} 
            alt={title}
            className="w-full h-full object-contain rounded-t-xl transition-opacity duration-200"
            style={{ opacity: loadedImages.has(currentMedia.src) ? 1 : 0.8 }}
            onError={() => handleImageError(currentImageIndex)}
            onLoad={() => {
              // Remove from error set if image loads successfully
              if (imageErrors.has(currentImageIndex)) {
                setImageErrors(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(currentImageIndex);
                  return newSet;
                });
              }
            }}
          />
          
          {/* Zoom button - visible on hover (desktop) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
            }}
            className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 hover:bg-black/80 text-white transition-opacity duration-200 hidden md:flex ${
              hovering ? 'opacity-100' : 'opacity-0'
            }`}
            title="View full size"
          >
            <ZoomIn size={18} />
          </Button>

          {/* Mobile tap indicator */}
          <div className="absolute inset-0 flex items-center justify-center md:hidden">
            <div className="bg-black/30 text-white px-3 py-1 rounded-full text-sm opacity-0 group-active:opacity-100 transition-opacity duration-150">
              Tap to zoom
            </div>
          </div>
        </div>
      );
    }
  };

  // Get only image URLs for the modal (exclude videos)
  const imageUrls = mediaItems
    .filter(item => item.type === 'image' && item.src !== '/placeholder.svg')
    .map(item => item.src);

  // Find video index for skip to video functionality
  const videoIndex = mediaItems.findIndex(item => 
    item.type === 'youtube_new' || item.type === 'youtube'
  );
  const hasVideo = videoIndex !== -1;
  const hasMultipleMedia = mediaItems.length > 1;

  const skipToVideo = () => {
    if (hasVideo) {
      setCurrentImageIndex(videoIndex);
    }
  };

  return (
    <>
      <div 
        className="relative h-[250px] sm:h-[350px] md:h-[450px] bg-gray-200 flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {mediaItems.length > 1 && (
          <>
            <button 
              onClick={handlePrevImage} 
              className="absolute left-4 p-2 bg-white rounded-full shadow-md z-10 text-gray-700 hover:bg-gray-100 transition"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={handleNextImage} 
              className="absolute right-4 p-2 bg-white rounded-full shadow-md z-10 text-gray-700 hover:bg-gray-100 transition"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
        
        {renderMedia()}
        
        {featured && (
          <div className="absolute top-4 left-4 z-10">
            <Badge className="bg-orange-500 text-white px-4 py-2 text-base font-semibold rounded-full shadow-md">
              Featured Property
            </Badge>
          </div>
        )}

        {/* Skip to Video Tour Button */}
        {hasVideo && hasMultipleMedia && currentImageIndex !== videoIndex && (
          <div className="absolute top-4 right-4 z-10">
            <Button
              onClick={skipToVideo}
              size="default"
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white border-none shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 px-4 py-2 font-semibold"
            >
              <Play size={18} className="fill-white" />
              <span className="text-sm font-bold">Skip to video tour</span>
            </Button>
          </div>
        )}
        
        {mediaItems.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {mediaItems.map((_, index) => (
              <span
                key={index}
                className={`h-2 w-2 rounded-full transition-all duration-200 ${
                  currentImageIndex === index ? 'bg-white' : 'bg-gray-400 opacity-70'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {imageUrls.length > 0 && (
        <ImageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          images={imageUrls}
          initialIndex={Math.max(0, imageUrls.findIndex(url => url === currentMedia.src))}
          title={title}
        />
      )}
    </>
  );
};

export default PropertyImageGallery;
