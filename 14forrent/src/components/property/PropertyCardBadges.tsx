
import { Badge } from "@/components/ui/badge";
import { Diamond, Bus, Train } from "lucide-react";

interface PropertyCardBadgesProps {
  featured?: boolean;
  tags?: string[];
  transportationOptions?: string[];
}

const PropertyCardBadges = ({ 
  featured, 
  tags = [], 
  transportationOptions = [] 
}: PropertyCardBadgesProps) => {
  // Function to get the appropriate icon for transportation
  const getTransportIcon = (option: string) => {
    const lowerOption = option.toLowerCase();
    if (lowerOption.includes('bus') || lowerOption.includes('stop')) {
      return <Bus size={12} />;
    }
    if (lowerOption.includes('train') || lowerOption.includes('subway') || 
        lowerOption.includes('metro') || lowerOption.includes('station')) {
      return <Train size={12} />;
    }
    return null;
  };
  
  return (
    <>
      <div className="absolute top-2 right-2 flex gap-2 flex-wrap justify-end">
        {featured && (
          <Badge className="bg-forrent-orange text-white font-medium px-2 py-1 flex items-center gap-1">
            <Diamond size={12} /> Featured
          </Badge>
        )}
        
        {/* Display transportation options with icons */}
        {transportationOptions.length > 0 && transportationOptions.slice(0, 2).map((option, index) => (
          <Badge key={`transport-${index}`} className="bg-blue-500 text-white font-medium px-2 py-1 flex items-center gap-1">
            {getTransportIcon(option)} {option}
          </Badge>
        ))}
      </div>
      
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="bg-forrent-gray text-forrent-navy">
              {tag}
            </Badge>
          ))}
          {tags.length > 3 && (
            <Badge variant="outline" className="bg-forrent-gray text-forrent-navy">
              +{tags.length - 3} more
            </Badge>
          )}
        </div>
      )}
    </>
  );
};

export default PropertyCardBadges;
