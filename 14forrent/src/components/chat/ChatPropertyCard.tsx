
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Bed, Bath, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import ScheduleTourButton from "@/components/property/ScheduleTourButton";
import { getSupabaseImageUrl } from "@/utils/imageUrl";

interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft?: number;
  images?: string[];
  description?: string;
  featured?: boolean;
  amenities?: string[];
}

interface ChatPropertyCardProps {
  property: Property;
}

const ChatPropertyCard = ({ property }: ChatPropertyCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();
  
  console.log('ChatPropertyCard rendering with property:', property);

  // GUARANTEE valid images - always have at least placeholder
  const images = property.images && property.images.length > 0
    ? property.images.filter(img => img && img.trim() !== '')
    : ['/placeholder.svg'];

  // Convert relative image paths to full Supabase URLs
  const validImages = images.length > 0
    ? images.map(img => {
        // If it's already a full URL or placeholder, use as-is
        if (img.startsWith('http') || img.startsWith('/')) {
          return img;
        }
        // Otherwise, convert to Supabase storage URL
        return getSupabaseImageUrl(img);
      })
    : ['/placeholder.svg'];

  console.log('Property images processed:', validImages);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % validImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  const handleCardClick = () => {
    console.log('Property card clicked, navigating to:', `/property/${property.id}`);
    navigate(`/property/${property.id}`);
  };

  // Ensure we have valid property data
  const safeBedrooms = property.bedrooms || 0;
  const safeBathrooms = property.bathrooms || 0;
  const safePrice = property.price || 0;
  const safeTitle = property.title || 'Property';
  const safeLocation = property.location || 'Location not specified';

  return (
    <Card className="w-full max-w-md border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-0">
        {/* Property Image with Navigation - Clickable */}
        <div className="relative h-48 rounded-t-lg overflow-hidden bg-gray-100 flex items-center justify-center" onClick={handleCardClick}>
          <img
            src={validImages[currentImageIndex]}
            alt={safeTitle}
            className="w-full h-full object-contain"
            onError={(e) => {
              console.log('Image failed to load:', validImages[currentImageIndex]);
              // Fallback to placeholder if image fails to load
              const target = e.target as HTMLImageElement;
              if (target.src !== '/placeholder.svg') {
                target.src = '/placeholder.svg';
              }
            }}
          />
          
          {/* Featured Badge */}
          {property.featured && (
            <div className="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              Featured
            </div>
          )}
          
          {/* Navigation Arrows */}
          {validImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-sm transition-colors"
              >
                <ChevronLeft size={16} className="text-gray-700" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-sm transition-colors"
              >
                <ChevronRight size={16} className="text-gray-700" />
              </button>
            </>
          )}
          
          {/* Image Dots */}
          {validImages.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {validImages.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Property Details - Also Clickable */}
        <div className="p-4 space-y-3" onClick={handleCardClick}>
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg text-blue-600 line-clamp-1">{safeTitle}</h3>
            <div className="text-right">
              <span className="text-2xl font-bold text-orange-500">${safePrice.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin size={14} className="mr-1" />
            <span className="line-clamp-1">{safeLocation}</span>
          </div>

          <div className="flex items-center space-x-6 text-sm text-gray-700">
            <div className="flex items-center">
              <Bed size={14} className="mr-1" />
              <span><strong>{safeBedrooms}</strong> beds</span>
            </div>
            <div className="flex items-center">
              <Bath size={14} className="mr-1" />
              <span><strong>{safeBathrooms}</strong> baths</span>
            </div>
            {property.sqft && (
              <div>
                <span><strong>{property.sqft.toLocaleString()}</strong> sqft</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Not clickable for navigation */}
        <div className="px-4 pb-4 pt-0 space-y-2">
          <Link to={`/property/${property.id}`} className="block">
            <Button variant="outline" className="w-full">
              View Details
            </Button>
          </Link>
          <ScheduleTourButton
            propertyId={property.id}
            propertyTitle={safeTitle}
            variant="default"
            size="default"
            fullWidth={true}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatPropertyCard;
