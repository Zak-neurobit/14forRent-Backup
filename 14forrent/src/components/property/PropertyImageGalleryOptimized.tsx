import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play, AlertCircle, ZoomIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import VideoEmbed from "./VideoEmbed";
import { ImageModal } from "@/components/ui/image-modal";

// Optimized cache with LRU eviction
class ImageUrlCache {
  private cache = new Map<string, string>();
  private maxSize = 100;
  
  get(key: string): string | undefined {
    const value = this.cache.get(key);
    if (value) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }
  
  set(key: string, value: string): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}

const imageUrlCache = new ImageUrlCache();

interface PropertyImageGalleryOptimizedProps {
  images: string[];
  mainImage: string;
  title: string;
  featured?: boolean;
  youtube_url?: string;
  video_id?: string;
  is_short?: boolean;
}

const PropertyImageGalleryOptimized = memo(({ 
  images, 
  mainImage, 
  title, 
  featured, 
  youtube_url, 
  video_id,
  is_short = false
}: PropertyImageGalleryOptimizedProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0])); // First image loaded
  const [isModalOpen, setIsModalOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const imageRefs = useRef<Map<number, HTMLImageElement>>(new Map());
  
  // Process image URL with caching
  const processImageUrl = useCallback((imgPath: string): string => {
    if (!imgPath || typeof imgPath !== 'string') return '/placeholder.svg';
    
    const trimmed = imgPath.trim();
    
    // Check for invalid URLs
    if (trimmed === '' ||
        trimmed === '/placeholder.svg' ||
        trimmed === 'placeholder.svg' ||
        trimmed.includes('undefined') ||
        trimmed.includes('null') ||
        trimmed.startsWith('blob:')) {
      return '/placeholder.svg';
    }
    
    // Return if already a full URL
    if (trimmed.startsWith('http')) {
      return trimmed;
    }
    
    // Check cache
    const cached = imageUrlCache.get(trimmed);
    if (cached) {
      return cached;
    }
    
    // Handle different path formats
    // If path already includes a folder (UUID/filename), use it as-is
    // Otherwise, assume it's just a filename
    let storagePath = trimmed;
    
    // Check if this looks like a UUID folder path (e.g., "uuid/filename")
    const hasFolder = trimmed.includes('/') && 
                     trimmed.split('/')[0].match(/^[a-f0-9-]{36}$/i);
    
    // Get public URL from Supabase
    // The path should already include any folder structure
    const { data } = supabase.storage
      .from('property_images')
      .getPublicUrl(storagePath);
    
    const publicUrl = data.publicUrl;
    imageUrlCache.set(trimmed, publicUrl);
    
    return publicUrl;
  }, []);
  
  // Optimized media items with memoization
  const mediaItems = useMemo(() => {
    const items = [];
    
    // Process images
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
    
    // Add video if exists
    if (video_id) {
      items.push({ 
        type: 'video', 
        id: video_id, 
        isShort: is_short || false 
      });
    } else if (youtube_url) {
      items.push({ type: 'youtube', src: youtube_url });
    }
    
    // Fallback
    if (items.length === 0) {
      items.push({ type: 'image', src: '/placeholder.svg' });
    }
    
    return items;
  }, [images, mainImage, video_id, youtube_url, is_short, processImageUrl]);

  const currentMedia = mediaItems[currentImageIndex];
  
  // Optimized preloading with priorities
  const preloadImage = useCallback((index: number, priority: 'high' | 'low' = 'low') => {
    if (loadedImages.has(index) || imageRefs.current.has(index)) return;
    
    const media = mediaItems[index];
    if (!media || media.type !== 'image') return;
    
    const img = new Image();
    if ('fetchPriority' in img) {
      (img as any).fetchPriority = priority;
    }
    
    img.onload = () => {
      imageRefs.current.set(index, img);
      setLoadedImages(prev => new Set(prev).add(index));
    };
    
    img.onerror = () => {
      setImageErrors(prev => new Set(prev).add(index));
    };
    
    img.src = media.src;
  }, [mediaItems, loadedImages]);
  
  // Smart preloading strategy
  useEffect(() => {
    // Current image - highest priority
    preloadImage(currentImageIndex, 'high');
    
    // Next and previous - high priority
    const next = (currentImageIndex + 1) % mediaItems.length;
    const prev = currentImageIndex === 0 ? mediaItems.length - 1 : currentImageIndex - 1;
    
    preloadImage(next, 'high');
    preloadImage(prev, 'high');
    
    // Preload next 2 images with low priority
    for (let i = 1; i <= 2; i++) {
      const index = (currentImageIndex + i + 1) % mediaItems.length;
      setTimeout(() => preloadImage(index, 'low'), i * 100);
    }
  }, [currentImageIndex, mediaItems.length, preloadImage]);

  const handleNextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % mediaItems.length);
  }, [mediaItems.length]);

  const handlePrevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  }, [mediaItems.length]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartX.current || mediaItems.length <= 1) return;
    
    const endX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - endX;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNextImage();
      } else {
        handlePrevImage();
      }
    }
    
    touchStartX.current = null;
  }, [mediaItems.length, handleNextImage, handlePrevImage]);

  const renderMedia = useCallback(() => {
    if (currentMedia.type === 'video') {
      // Render YouTube video with VideoEmbed component
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
      // Legacy YouTube URL support
      const extractYouTubeId = (url: string): string => {
        const regex = /(?:youtube\.com\/.*v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/;
        const match = url.match(regex);
        return match ? match[1] : '';
      };
      const videoId = extractYouTubeId(currentMedia.src);
      const isShort = currentMedia.src.includes('/shorts/');
      
      if (videoId) {
        return (
          <div className="relative w-full h-full">
            <VideoEmbed 
              id={videoId} 
              isShort={isShort}
              title={`${title} - Video Tour`}
              className="w-full h-full"
            />
          </div>
        );
      } else {
        return (
          <div className="relative w-full h-full bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <AlertCircle className="mx-auto mb-2 h-8 w-8" />
              <p>Invalid video URL</p>
            </div>
          </div>
        );
      }
    }
    
    // Image rendering with loading state
    const isLoaded = loadedImages.has(currentImageIndex);
    const hasError = imageErrors.has(currentImageIndex);
    
    if (hasError) {
      return (
        <div className="relative w-full h-full bg-gray-100 rounded-t-xl flex items-center justify-center">
          <img src="/placeholder.svg" alt={title} className="w-full h-full object-contain rounded-t-xl" />
        </div>
      );
    }
    
    return (
      <div 
        className="relative w-full h-full bg-gray-100 rounded-t-xl flex items-center justify-center cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-[#1A2953] rounded-full" />
          </div>
        )}
        
        <img 
          src={currentMedia.src} 
          alt={title}
          className={`w-full h-full object-contain rounded-t-xl transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setLoadedImages(prev => new Set(prev).add(currentImageIndex))}
          onError={() => setImageErrors(prev => new Set(prev).add(currentImageIndex))}
          loading="eager"
        />
        
        {isLoaded && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 text-white"
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
            }}
          >
            <ZoomIn size={18} />
          </Button>
        )}
      </div>
    );
  }, [currentMedia, currentImageIndex, title, loadedImages, imageErrors, setIsModalOpen]);

  const hasMultipleMedia = mediaItems.length > 1;
  
  // Find video index for skip to video functionality
  const videoIndex = mediaItems.findIndex(item => 
    item.type === 'video' || item.type === 'youtube'
  );
  const hasVideo = videoIndex !== -1;
  
  const skipToVideo = () => {
    if (hasVideo) {
      setCurrentImageIndex(videoIndex);
    }
  };

  return (
    <div 
      className="relative h-[250px] sm:h-[350px] md:h-[450px] bg-gray-200 flex items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {hasMultipleMedia && (
        <>
          <button 
            onClick={handlePrevImage} 
            className="absolute left-4 p-2 bg-white rounded-full shadow-md z-10 text-gray-700 hover:bg-gray-100 transition"
            aria-label="Previous image"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={handleNextImage} 
            className="absolute right-4 p-2 bg-white rounded-full shadow-md z-10 text-gray-700 hover:bg-gray-100 transition"
            aria-label="Next image"
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
      
      {/* Image indicators */}
      {hasMultipleMedia && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {mediaItems.map((_, index) => (
            <button
              key={index}
              className={`h-2 w-2 rounded-full transition-all duration-200 ${
                currentImageIndex === index ? 'bg-white w-6' : 'bg-gray-400 opacity-70'
              }`}
              onClick={() => setCurrentImageIndex(index)}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
      
      {/* Image Modal for enlarged view */}
      {(() => {
        // Get only image URLs for the modal (exclude videos and placeholders)
        const imageUrls = mediaItems
          .filter(item => item.type === 'image' && item.src !== '/placeholder.svg')
          .map(item => item.src);
        
        // Find current image index in the filtered list
        const currentImageUrl = currentMedia?.type === 'image' ? currentMedia.src : null;
        const modalInitialIndex = currentImageUrl ? imageUrls.indexOf(currentImageUrl) : 0;
        
        return imageUrls.length > 0 ? (
          <ImageModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            images={imageUrls}
            initialIndex={modalInitialIndex >= 0 ? modalInitialIndex : 0}
            title={title}
          />
        ) : null;
      })()}
    </div>
  );
});

PropertyImageGalleryOptimized.displayName = "PropertyImageGalleryOptimized";

export default PropertyImageGalleryOptimized;