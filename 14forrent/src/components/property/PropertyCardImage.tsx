
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { propertyImageService, PropertyImageWithAltText } from "@/services/propertyImageService";

interface PropertyCardImageProps {
  images: string[];
  title: string;
  listingId?: string; // For fetching AI-generated alt text
}

const PropertyCardImage = ({ images, title, listingId }: PropertyCardImageProps) => {
  const [imageIndex, setImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [propertyImages, setPropertyImages] = useState<PropertyImageWithAltText[]>([]);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  
  // Skip AI alt text fetching for performance - use simple alt text instead
  // This was causing multiple API calls and slowing down image loading
  useEffect(() => {
    // Commented out for performance - can be re-enabled if needed
    // if (listingId) {
    //   propertyImageService.getPropertyImages(listingId).then(setPropertyImages);
    // }
  }, [listingId]);
  
  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  };

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  };

  const handleImageError = (index: number) => {
    console.error('Image failed to load:', images[index]);
    setImageErrors(prev => new Set(prev).add(index));
  };

  // Process image URL to get public URL from property_images bucket
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
    
    return data.publicUrl;
  };

  // Get current image URL, with fallback logic
  const getCurrentImageUrl = () => {
    const currentPath = images[imageIndex];
    const processedUrl = processImageUrl(currentPath);
    
    // If current image has error, try to find a working image
    if (imageErrors.has(imageIndex)) {
      const workingImageIndex = images.findIndex((img, index) => {
        return !imageErrors.has(index) && processImageUrl(img) !== '/placeholder.svg';
      });
      if (workingImageIndex !== -1) {
        return processImageUrl(images[workingImageIndex]);
      }
      return '/placeholder.svg';
    }
    
    return processedUrl;
  };

  // Get enhanced alt text for current image
  const getCurrentAltText = () => {
    const currentImageUrl = images[imageIndex];
    
    // Find matching property image with AI-generated alt text
    const propertyImage = propertyImages.find(img => 
      img.image_url === currentImageUrl || 
      img.image_url.includes(currentImageUrl) ||
      currentImageUrl.includes(img.image_url.split('/').pop() || '')
    );
    
    if (propertyImage && propertyImage.alt_text) {
      return propertyImage.alt_text;
    }
    
    // Fallback to title-based alt text
    return `${title} - Property Image ${imageIndex + 1}`;
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
    if (images.length <= 1) return; // Only enable swipe if multiple images

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
      prevImage();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };
  
  return (
    <div className="relative">
      <div 
        className="relative aspect-[3/4] bg-gray-100 flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img 
          src={getCurrentImageUrl()}
          alt={getCurrentAltText()} 
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          fetchpriority={imageIndex === 0 ? "high" : "low"}
          onError={() => handleImageError(imageIndex)}
          onLoad={() => {
            // Remove from error set if image loads successfully
            if (imageErrors.has(imageIndex)) {
              setImageErrors(prev => {
                const newSet = new Set(prev);
                newSet.delete(imageIndex);
                return newSet;
              });
            }
          }}
        />
      </div>
      
      {/* Arrows for image navigation */}
      {images.length > 1 && !imageErrors.has(imageIndex) && (
        <>
          <button 
            onClick={prevImage}
            className="thumbnail-arrow left-2"
            aria-label="Previous image"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={nextImage}
            className="thumbnail-arrow right-2"
            aria-label="Next image"
          >
            <ChevronRight size={18} />
          </button>
          
          {/* Image dots indicator */}
          <div className="thumbnail-dots">
            {images.map((_, index) => (
              <span 
                key={index} 
                className={`thumbnail-dot ${index === imageIndex ? 'thumbnail-dot-active' : ''}`}
                aria-label={`Image ${index + 1} of ${images.length}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PropertyCardImage;
