import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  WashingMachine, 
  Car, 
  Flame, 
  Home,
  Cat,
  Dog,
  Utensils,
  Trees,
  Wind,
  Dumbbell,
  Waves,
  Building2,
  Snowflake,
  ArrowUpDown,
  Sofa,
  Train,
  Shield,
  Wifi,
  Tag
} from "lucide-react";

interface PropertyAdditionalDetailsProps {
  date_available?: string;
  laundry_type?: string;
  parking_type?: string;
  heating_type?: string;
  rental_type?: string;
  cat_friendly?: boolean;
  dog_friendly?: boolean;
  amenities?: string[];
}

const PropertyAdditionalDetails = ({ 
  date_available,
  laundry_type,
  parking_type,
  heating_type,
  rental_type,
  cat_friendly,
  dog_friendly,
  amenities = []
}: PropertyAdditionalDetailsProps) => {
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Format the field values for display
  const formatFieldValue = (value: string) => {
    return value
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Icon mapping for amenities
  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    
    // Handle old-style amenity names from checkbox era
    if (amenityLower === 'pool' || amenityLower.includes('pool')) return <Waves className="text-[#1A2953] flex-shrink-0" size={24} />;
    if (amenityLower === 'gym' || amenityLower.includes('gym')) return <Dumbbell className="text-[#1A2953] flex-shrink-0" size={24} />;
    if (amenityLower === 'parking' || amenityLower.includes('parking')) return <Car className="text-[#1A2953] flex-shrink-0" size={24} />;
    if (amenityLower === 'pet-friendly' || amenityLower.includes('pet')) return <Dog className="text-[#1A2953] flex-shrink-0" size={24} />;
    if (amenityLower === 'furnished' || amenityLower.includes('furnished')) return <Sofa className="text-[#1A2953] flex-shrink-0" size={24} />;
    
    // Handle new-style amenity names
    if (amenityLower.includes('dishwasher')) return <Utensils className="text-[#1A2953] flex-shrink-0" size={24} />;
    if (amenityLower.includes('balcony')) return <Trees className="text-[#1A2953] flex-shrink-0" size={24} />;
    if (amenityLower.includes('central air')) return <Wind className="text-[#1A2953] flex-shrink-0" size={24} />;
    if (amenityLower.includes('rooftop')) return <Building2 className="text-[#1A2953] flex-shrink-0" size={24} />;
    if (amenityLower.includes('air conditioning')) return <Snowflake className="text-[#1A2953] flex-shrink-0" size={24} />;
    if (amenityLower.includes('elevator')) return <ArrowUpDown className="text-[#1A2953] flex-shrink-0" size={24} />;
    if (amenityLower.includes('metro')) return <Train className="text-[#1A2953] flex-shrink-0" size={24} />;
    if (amenityLower.includes('security')) return <Shield className="text-[#1A2953] flex-shrink-0" size={24} />;
    if (amenityLower.includes('wifi')) return <Wifi className="text-[#1A2953] flex-shrink-0" size={24} />;
    
    // Default icon
    return <Tag className="text-[#1A2953] flex-shrink-0" size={24} />;
  };

  // Format amenity name for display
  const formatAmenityName = (amenity: string) => {
    // Handle special cases for old amenity names
    if (amenity.toLowerCase() === 'pet-friendly') return 'Pet Friendly';
    
    // Capitalize each word
    return amenity
      .split(/[\s-]+/) // Split on spaces and hyphens
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Only show section if there are details to display
  const hasDetails = date_available || laundry_type || parking_type || 
                    heating_type || rental_type || cat_friendly || dog_friendly || 
                    (amenities && amenities.length > 0);

  console.log('PropertyAdditionalDetails - hasDetails:', hasDetails, {
    date_available,
    laundry_type,
    parking_type,
    heating_type,
    rental_type,
    cat_friendly,
    dog_friendly,
    amenities,
    amenitiesLength: amenities?.length
  });

  if (!hasDetails) {
    console.log('PropertyAdditionalDetails returning null - no details to show');
    return null;
  }

  return (
    <div className="bg-gray-50 rounded-xl p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {(date_available || laundry_type || parking_type || heating_type || rental_type || cat_friendly || dog_friendly) 
          ? 'Property Details' 
          : 'Amenities & Features'}
      </h2>
      
      {(date_available || laundry_type || parking_type || heating_type || rental_type || cat_friendly || dog_friendly) && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {date_available && (
          <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm">
            <Calendar className="text-[#1A2953] flex-shrink-0" size={24} />
            <div>
              <p className="text-sm text-gray-500">Available From</p>
              <p className="font-semibold text-gray-800">{formatDate(date_available)}</p>
            </div>
          </div>
        )}

        {rental_type && (
          <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm">
            <Home className="text-[#1A2953] flex-shrink-0" size={24} />
            <div>
              <p className="text-sm text-gray-500">Rental Type</p>
              <p className="font-semibold text-gray-800">{formatFieldValue(rental_type)}</p>
            </div>
          </div>
        )}

        {laundry_type && (
          <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm">
            <WashingMachine className="text-[#1A2953] flex-shrink-0" size={24} />
            <div>
              <p className="text-sm text-gray-500">Laundry</p>
              <p className="font-semibold text-gray-800">{formatFieldValue(laundry_type)}</p>
            </div>
          </div>
        )}

        {parking_type && (
          <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm">
            <Car className="text-[#1A2953] flex-shrink-0" size={24} />
            <div>
              <p className="text-sm text-gray-500">Parking</p>
              <p className="font-semibold text-gray-800">{formatFieldValue(parking_type)}</p>
            </div>
          </div>
        )}

        {heating_type && (
          <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm">
            <Flame className="text-[#1A2953] flex-shrink-0" size={24} />
            <div>
              <p className="text-sm text-gray-500">Heating</p>
              <p className="font-semibold text-gray-800">{formatFieldValue(heating_type)}</p>
            </div>
          </div>
        )}

        {/* Pet Policy Section */}
        {(cat_friendly || dog_friendly) && (
          <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm">
            <div className="flex gap-2">
              {cat_friendly && <Cat className="text-[#1A2953]" size={24} />}
              {dog_friendly && <Dog className="text-[#1A2953]" size={24} />}
            </div>
            <div>
              <p className="text-sm text-gray-500">Pet Policy</p>
              <div className="flex gap-2 mt-1">
                {cat_friendly && (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    Cats OK
                  </Badge>
                )}
                {dog_friendly && (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    Dogs OK
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Additional Amenities & Features */}
      {amenities && amenities.length > 0 && (
        <>
          {(date_available || laundry_type || parking_type || heating_type || rental_type || cat_friendly || dog_friendly) && (
            <h3 className="text-lg font-semibold text-gray-700 mt-6 mb-4">Amenities & Features</h3>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {amenities.map((amenity, index) => (
              <div key={index} className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm">
                {getAmenityIcon(amenity)}
                <div>
                  <p className="font-semibold text-gray-800">{formatAmenityName(amenity)}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PropertyAdditionalDetails;