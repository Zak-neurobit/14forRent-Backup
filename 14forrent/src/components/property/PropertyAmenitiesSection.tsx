
import { Tag } from "lucide-react";

interface PropertyAmenitiesSectionProps {
  amenities: string[];
}

const PropertyAmenitiesSection = ({ amenities }: PropertyAmenitiesSectionProps) => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-100 pb-2">Amenities & Features</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {amenities.map((amenity, index) => (
          <div key={index} className="flex items-center text-gray-700">
            <Tag size={18} className="mr-3 text-[#1A2953] flex-shrink-0" />
            <span className="text-lg">{amenity}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertyAmenitiesSection;
