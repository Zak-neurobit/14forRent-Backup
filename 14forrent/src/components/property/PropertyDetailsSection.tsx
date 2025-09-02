
import { Badge } from "@/components/ui/badge";
import { BedDouble, Bath, SquareCode, Home, MapPin } from "lucide-react";
import { ShareButton } from "./ShareButton";

interface PropertyDetailsSectionProps {
  title: string;
  location?: string;
  address?: string;
  price: number | string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  type?: string;
  securityDeposit?: number;
}

const PropertyDetailsSection = ({ 
  title, 
  location, 
  address, 
  price, 
  bedrooms, 
  bathrooms, 
  sqft, 
  type,
  securityDeposit 
}: PropertyDetailsSectionProps) => {
  return (
    <>
      {/* Title & Price */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2 leading-tight">
            {title}
          </h1>
          <p className="flex items-center text-gray-600 text-lg">
            <MapPin size={20} className="mr-2 text-[#1A2953]" />
            {address || location || "Location not specified"}
          </p>
        </div>
        <div className="text-right ml-4 flex-shrink-0">
          <div className="text-4xl font-bold text-green-600">
            {typeof price === 'number' 
              ? `$${price.toLocaleString()}` 
              : price}
            <span className="text-lg text-gray-600 font-normal">/month</span>
          </div>
          {securityDeposit && securityDeposit > 0 && (
            <div className="text-sm text-gray-600 mt-1">
              + ${securityDeposit.toLocaleString()} deposit
            </div>
          )}
        </div>
      </div>
      
      {/* Share Button */}
      <div className="flex justify-start mb-6">
        <ShareButton
          title={`${title} - ${location || 'Property for Rent'}`}
          description={`${bedrooms || 0} bed, ${bathrooms || 0} bath ${type?.toLowerCase() || 'property'} for rent. ${typeof price === 'number' ? `$${price.toLocaleString()}` : price}/month`}
          variant="outline"
          size="sm"
          className="text-gray-600 hover:text-[#1A2953] hover:border-[#1A2953]"
        />
      </div>
      
      {/* Key Features / Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
        <Badge className="flex items-center justify-center p-3 gap-2 bg-[#1A2953]/10 text-[#1A2953] font-medium text-base rounded-lg">
          <BedDouble size={20} />
          <span>{bedrooms === 0 ? 'Studio' : `${bedrooms || 0} Bed${bedrooms !== 1 ? 's' : ''}`}</span>
        </Badge>
        <Badge className="flex items-center justify-center p-3 gap-2 bg-[#1A2953]/10 text-[#1A2953] font-medium text-base rounded-lg">
          <Bath size={20} />
          <span>{bathrooms || 0} Baths</span>
        </Badge>
        <Badge className="flex items-center justify-center p-3 gap-2 bg-[#1A2953]/10 text-[#1A2953] font-medium text-base rounded-lg">
          <SquareCode size={20} />
          <span>{sqft ? `${sqft} sqft` : 'N/A'}</span>
        </Badge>
        <Badge className="flex items-center justify-center p-3 gap-2 bg-[#1A2953]/10 text-[#1A2953] font-medium text-base rounded-lg">
          <Home size={20} />
          <span>{type || "Property"}</span>
        </Badge>
      </div>
    </>
  );
};

export default PropertyDetailsSection;
