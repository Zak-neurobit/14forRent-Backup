
import { Link } from "react-router-dom";
import { useCallback, useRef } from "react";
import PropertyCardImage from "./property/PropertyCardImage";
import PropertyCardBadges from "./property/PropertyCardBadges";
import PropertyCardFavorite from "./property/PropertyCardFavorite";
import PropertyCardDetails from "./property/PropertyCardDetails";
import PropertyCardActions from "./property/PropertyCardActions";
import ScheduleTourButton from "./property/ScheduleTourButton";
import { propertyService } from "@/services/propertyService";

interface PropertyCardProps {
  id: string;
  image?: string;
  title: string;
  price: string | number; 
  beds: number;
  baths: number;
  sqft: number;
  address: string;
  tags?: string[];
  featured?: boolean;
  manageable?: boolean;
  images?: string[];
  video_id?: string;
  is_short?: boolean;
}

const PropertyCard = ({
  id,
  image,
  title,
  price,
  beds,
  baths,
  sqft,
  address,
  tags = [],
  featured = false,
  manageable = false,
  images = [],
  video_id,
  is_short = false,
}: PropertyCardProps) => {
  // Use the main image if no images array provided or use the images array if available
  const allImages = images.length > 0 ? images : (image ? [image] : ['/placeholder.svg']);
  
  // Format price to string if it's a number
  const formattedPrice = typeof price === 'number' ? `$${price.toLocaleString()}` : price;
  
  // Prefetch timer ref
  const prefetchTimer = useRef<NodeJS.Timeout>();
  
  // Preload images for faster navigation
  const preloadImages = useCallback((imageUrls: string[]) => {
    imageUrls.slice(0, 3).forEach(url => {
      if (url && url !== '/placeholder.svg') {
        const img = new Image();
        img.src = url;
      }
    });
  }, []);
  
  // Prefetch property data on hover
  const handleMouseEnter = useCallback(() => {
    // Start prefetch after 200ms to avoid unnecessary requests
    prefetchTimer.current = setTimeout(() => {
      // Prefetch property data
      propertyService.getPropertyById(id);
      // Preload first 3 images
      preloadImages(allImages);
    }, 200);
  }, [id, allImages, preloadImages]);
  
  // Cancel prefetch on mouse leave
  const handleMouseLeave = useCallback(() => {
    if (prefetchTimer.current) {
      clearTimeout(prefetchTimer.current);
    }
  }, []);
  
  return (
    <div 
      className="card-hover bg-white rounded-lg overflow-hidden border border-gray-200"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link to={`/property/${id}`} className="block">
        <div className="relative">
          <PropertyCardImage images={allImages} title={title} />
          <PropertyCardBadges featured={featured} tags={tags} />
          <div className="absolute top-2 left-2 z-20">
            <PropertyCardFavorite id={id} />
          </div>
          {video_id && (
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              {is_short ? '📱 Short' : '🎬 Video'}
            </div>
          )}
        </div>
        
        <div className="p-4">
          <PropertyCardDetails
            title={title}
            price={formattedPrice}
            address={address}
            beds={beds}
            baths={baths}
            sqft={sqft}
          />
        </div>
      </Link>
      
      <div className="px-4 pb-4 pt-0 flex items-center justify-between">
        <ScheduleTourButton 
          propertyId={id} 
          propertyTitle={title} 
          variant="outline"
          size="sm"
        />
        
        {manageable && <PropertyCardActions manageable={manageable} />}
      </div>
    </div>
  );
};

export default PropertyCard;
