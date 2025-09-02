
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { generatePropertyDescription } from "@/services/ai/generateDescription";
import { supabase } from "@/integrations/supabase/client";
import { embedListing } from "@/services/ai/embeddings";
import { parseYouTube } from "@/lib/youtube";
import { propertyService } from "@/services/propertyService";
import { processThumbnailForSocialMedia } from "@/utils/thumbnailConversion";

interface FormData {
  title: string;
  location?: string; // Make optional for backward compatibility
  description: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: FileList | null;
  sqft: number;
  address: string;
  type: string;
  youtube_url: string;
  dateAvailable?: string;
  laundryType?: string;
  parkingType?: string;
  heatingType?: string;
  rentalType?: string;
  catFriendly?: boolean;
  dogFriendly?: boolean;
  additionalAmenities?: string[];
  securityDeposit?: number;
}

export const usePropertyForm = (listingId?: string) => {
  console.log("usePropertyForm initialized with listingId:", listingId);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [thumbnailIndex, setThumbnailIndex] = useState<number>(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const form = useForm<FormData>({
    defaultValues: {
      title: "",
      location: "", // Keep for backward compatibility
      description: "",
      price: 1500,
      bedrooms: 1,
      bathrooms: 1,
      amenities: [],
      images: null,
      sqft: 1000,
      address: "",
      type: "Apartment",
      youtube_url: "",
      dateAvailable: "",
      laundryType: "",
      parkingType: "",
      heatingType: "",
      rentalType: "",
      catFriendly: false,
      dogFriendly: false,
      additionalAmenities: [],
      securityDeposit: 0,
    },
  });

  const generateAIDescription = async () => {
    const title = form.getValues('title');
    const address = form.getValues('address');
    const location = form.getValues('location') || address; // Use address if location is empty
    const price = form.getValues('price');
    const bedrooms = form.getValues('bedrooms');
    const bathrooms = form.getValues('bathrooms');
    const amenities = form.getValues('amenities');

    if (!title || !address) {
      toast.error("Missing information", { 
        description: "Please fill in at least the title and address to generate a description",
        duration: 5000
      });
      return;
    }

    setGeneratingDescription(true);
    
    try {
      const description = await generatePropertyDescription({
        title,
        location, 
        price,
        bedrooms,
        bathrooms,
        amenities
      });
      
      form.setValue('description', description);
      toast.success("Description generated successfully!", { duration: 5000 });
      
      if (descriptionRef.current) {
        descriptionRef.current.focus();
        descriptionRef.current.select();
      }
    } catch (error) {
      console.error("Error generating description:", error);
      toast.error("Failed to generate description", { 
        description: "Please try again or write your own description",
        duration: 5000
      });
    } finally {
      setGeneratingDescription(false);
    }
  };

  const uploadImageToStorage = async (file: File, folderId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      // Use the provided folder ID (will be listing ID for new uploads, user ID for legacy)
      const fileName = `${folderId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      console.log('Uploading file to property_images storage:', fileName);

      const { error: uploadError } = await supabase.storage
        .from('property_images')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      console.log('Successfully uploaded to property_images:', fileName);
      return fileName;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const onSubmit = async (data: FormData) => {
    console.log("Starting form submission with data:", data);
    console.log("ListingId parameter:", listingId);
    console.log("Is update mode:", !!listingId);
    
    // CRITICAL SAFETY CHECK: Prevent accidental creation when updating
    if (listingId && !listingId.trim()) {
      console.error("CRITICAL: Empty listingId detected - aborting to prevent duplicate creation");
      toast.error("Invalid listing ID", {
        description: "Cannot update listing with empty ID. Please refresh and try again.",
        duration: 5000
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Validate required fields
      if (!data.title || !data.address || !data.description) {
        toast.error("Missing required fields", {
          description: "Please fill in title, address, and description",
          duration: 5000
        });
        setIsSubmitting(false);
        return;
      }

      // Parse YouTube URL if provided
      const youtubeData = data.youtube_url ? parseYouTube(data.youtube_url) : null;
      if (data.youtube_url && !youtubeData) {
        toast.error("Invalid YouTube URL", {
          description: "Please enter a valid YouTube URL (regular videos, shorts, or embeds)",
          duration: 5000
        });
        setIsSubmitting(false);
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Auth error:", userError);
        toast.error("Authentication error", {
          description: "Please try logging in again",
          duration: 5000
        });
        setIsSubmitting(false);
        return;
      }
      
      const userId = userData?.user?.id;
      
      if (!userId) {
        toast.error("You need to be logged in to create a listing", { duration: 5000 });
        navigate("/login", { state: { from: "/list" } });
        setIsSubmitting(false);
        return;
      }

      // Upload images to property_images bucket
      let uploadedImagePaths: string[] = [];
      if (imageUrls.length > 0) {
        console.log(`Using ${imageUrls.length} already uploaded images...`);
        // Extract paths from URLs
        uploadedImagePaths = imageUrls.map(url => {
          // Extract the path from the full URL
          const urlParts = url.split('/');
          const bucketIndex = urlParts.findIndex(part => part === 'property_images');
          if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
            return urlParts.slice(bucketIndex + 1).join('/');
          }
          return url;
        });
        console.log('Image paths to store:', uploadedImagePaths);
      }
      
      // Combine regular amenities with additional amenities
      const allAmenities = [
        ...(data.amenities || []),
        ...(data.additionalAmenities || [])
      ];
      const amenitiesArray = allAmenities.length > 0 ? allAmenities : [];

      const baseListingData = {
        title: data.title.trim(),
        location: data.address?.trim() || data.location?.trim() || "", // Use address as location for backward compatibility
        description: data.description.trim(),
        price: Number(data.price),
        bedrooms: Number(data.bedrooms),
        bathrooms: Number(data.bathrooms),
        amenities: amenitiesArray,
        images: uploadedImagePaths, // Store paths relative to property_images bucket
        sqft: Number(data.sqft),
        address: data.address?.trim() || "",
        type: data.type,
        youtube_url: data.youtube_url?.trim() || null,
        video_id: youtubeData?.id || null,
        is_short: youtubeData?.isShort || false,
        updated_at: new Date().toISOString(),
        date_available: data.dateAvailable || null,
        laundry_type: data.laundryType || null,
        parking_type: data.parkingType || null,
        heating_type: data.heatingType || null,
        rental_type: data.rentalType || null,
        cat_friendly: data.catFriendly || false,
        dog_friendly: data.dogFriendly || false,
        security_deposit: data.securityDeposit ? Number(data.securityDeposit) : null
      };

      // Only include user_id for new listings, not for updates
      const listingData = listingId 
        ? baseListingData 
        : { ...baseListingData, user_id: userId };

      console.log("Submitting listing with processed data:", listingData);

      let result;
      if (listingId) {
        // Update existing listing
        console.log("UPDATING existing listing:", listingId);
        console.log("Update data:", listingData);
        
        // First, let's check if the listing exists
        const { data: existingListing } = await supabase
          .from('listings')
          .select('id, title')
          .eq('id', listingId)
          .single();
        console.log("Existing listing check:", existingListing);
        
        if (!existingListing) {
          console.error("CRITICAL: Trying to update non-existent listing:", listingId);
          toast.error("Listing not found", {
            description: "The listing you're trying to edit no longer exists.",
            duration: 5000
          });
          setIsSubmitting(false);
          return;
        }
        
        result = await supabase
          .from('listings')
          .update(listingData)
          .eq('id', listingId)
          .select()
          .single();
        console.log("Update result:", result);
        
        // Additional safety check: ensure we updated the correct listing
        if (result.data && result.data.id !== listingId) {
          console.error("CRITICAL: Update returned different ID than expected!");
          console.error("Expected:", listingId, "Got:", result.data.id);
          toast.error("Update Error", {
            description: "Update operation returned unexpected result. Please try again.",
            duration: 5000
          });
          setIsSubmitting(false);
          return;
        }
      } else {
        // Create new listing
        console.log("Creating new listing");
        console.log("Insert data:", listingData);
        result = await supabase
          .from('listings')
          .insert(listingData)
          .select()
          .single();
        console.log("Insert result:", result);
      }

      const { data: newListing, error: listingError } = result;

      if (listingError) {
        console.error("Database error submitting listing:", listingError);
        console.error("Error details:", JSON.stringify(listingError, null, 2));
        
        if (listingError.code === '23505') {
          toast.error("Duplicate listing", {
            description: "A listing with similar details already exists",
            duration: 5000
          });
        } else if (listingError.code === '23502') {
          toast.error("Missing required data", {
            description: "Please check all required fields are filled",
            duration: 5000
          });
        } else {
          toast.error("Database error", {
            description: `Failed to save listing: ${listingError.message}`,
            duration: 5000
          });
        }
        setIsSubmitting(false);
        return;
      }

      if (newListing) {
        const actionText = listingId ? "updated" : "created";
        console.log(`Listing ${actionText} successfully:`, newListing.id);
        
        // Invalidate ALL caches to ensure updates are reflected everywhere
        if (listingId) {
          propertyService.invalidateCache('listings', listingId);
          // Also clear localStorage caches for PropertyDetail
          localStorage.removeItem(`property_cache_v2_${listingId}`);
          // Clear any other cached versions
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.includes(listingId) || key.includes('property_cache')) {
              localStorage.removeItem(key);
            }
          });
          console.log('All caches invalidated for updated listing:', listingId);
        } else {
          propertyService.invalidateCache('listings');
          console.log('Cache invalidated for new listing');
        }
        
        // CRITICAL FINAL CHECK: Ensure update didn't create duplicate
        if (listingId && newListing.id !== listingId) {
          console.error("CRITICAL ERROR: Update created new listing instead of updating existing one!");
          console.error("Expected ID:", listingId, "Got ID:", newListing.id);
          
          // Try to clean up the duplicate listing that was accidentally created
          try {
            await supabase
              .from('listings')
              .delete()
              .eq('id', newListing.id);
            console.log("Attempted to clean up duplicate listing:", newListing.id);
          } catch (cleanupError) {
            console.error("Failed to clean up duplicate:", cleanupError);
          }
          
          toast.error("Critical Error - Duplicate Created", {
            description: "Update accidentally created a duplicate. We attempted cleanup. Please check your listings.",
            duration: 15000
          });
          setIsSubmitting(false);
          return;
        }
        
        // Create embedding in background (non-blocking) - only for new listings
        if (!listingId) {
          try {
            embedListing(newListing.id)
              .then(result => {
                console.log("Embedding creation result:", result);
              })
              .catch(err => {
                console.error("Failed to create embedding (non-critical):", err);
              });
          } catch (embedError) {
            console.warn("Embedding generation failed (non-critical):", embedError);
          }
        }
        
        // Process thumbnail for social media preview (background, non-blocking)
        // This works for both new listings and updates to enable JPEG conversion for older listings
        // Use the selected thumbnail index, not necessarily the first image
        if (uploadedImagePaths.length > 0 && thumbnailIndex >= 0 && thumbnailIndex < uploadedImagePaths.length) {
          try {
            const thumbnailPath = uploadedImagePaths[thumbnailIndex];
            const actionText = listingId ? "Updating" : "Processing";
            console.log(`${actionText} thumbnail at index ${thumbnailIndex}: ${thumbnailPath}`);
            
            // Get the Supabase URL from the public URL
            const { data: { publicUrl } } = supabase.storage
              .from('property_images')
              .getPublicUrl(thumbnailPath);
            const thumbnailUrl = publicUrl;
            
            processThumbnailForSocialMedia(thumbnailUrl, newListing.id)
              .then(async (jpegUrl) => {
                if (jpegUrl) {
                  // Update the listing with the JPEG URL for social previews
                  const { error: updateError } = await supabase
                    .from('listings')
                    .update({ social_preview_image: jpegUrl })
                    .eq('id', newListing.id);
                  
                  if (!updateError) {
                    console.log('Social preview image saved for listing:', newListing.id);
                  } else {
                    console.error('Failed to save social preview image:', updateError);
                  }
                }
              })
              .catch(err => {
                console.error('Failed to process thumbnail for social media (non-critical):', err);
              });
          } catch (thumbnailError) {
            console.warn('Thumbnail processing failed (non-critical):', thumbnailError);
          }
        }
      }

      // Clean up blob URLs
      imageUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });

      const successMessage = listingId ? "Listing updated successfully" : "Listing submitted successfully";
      const successDescription = listingId ? "Your changes have been saved to the database" : "Your property has been added to our database";

      toast.success(successMessage, {
        description: successDescription,
        duration: 5000
      });
      
      // Reset form and navigate
      if (!listingId) {
        // Only reset and navigate for new listings
        form.reset();
        setImageFiles([]);
        setImageUrls([]);
        setThumbnailIndex(0);
        setVideoFile(null);
        setVideoUrl("");
        navigate("/my-listings");
      } else {
        // For updates, navigate to the property detail page
        navigate(`/property/${listingId}`);
      }
      
    } catch (error) {
      console.error("Unexpected error submitting listing:", error);
      toast.error("Submission failed", {
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isSubmitting,
    imageFiles,
    setImageFiles,
    imageUrls,
    setImageUrls,
    thumbnailIndex,
    setThumbnailIndex,
    videoFile,
    setVideoFile,
    videoUrl,
    setVideoUrl,
    generatingDescription,
    generateAIDescription,
    onSubmit,
    descriptionRef
  };
};
