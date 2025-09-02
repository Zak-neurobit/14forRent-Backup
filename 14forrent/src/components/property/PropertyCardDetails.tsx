
interface PropertyCardDetailsProps {
  title: string;
  price: string; // Keep this as string since we're formatting before passing
  address: string;
  beds: number;
  baths: number;
  sqft: number | null; // Allow null values
}

const PropertyCardDetails = ({ title, price, address, beds, baths, sqft }: PropertyCardDetailsProps) => {
  return (
    <>
      <div className="flex justify-between items-start gap-2">
        <h3 className="font-bold text-base sm:text-lg text-forrent-navy line-clamp-1">{title}</h3>
        <p className="font-bold text-forrent-orange text-sm sm:text-base whitespace-nowrap">{price}</p>
      </div>
      
      <p className="text-gray-500 text-xs sm:text-sm mb-2 line-clamp-1">{address}</p>
      
      <div className="flex items-center gap-2 sm:gap-4 my-2 text-sm sm:text-base">
        <div className="flex items-center">
          {beds === 0 ? (
            <span className="font-medium text-gray-700">Studio</span>
          ) : (
            <>
              <span className="font-medium">{beds}</span>
              <span className="text-gray-500 ml-1">bed{beds !== 1 ? 's' : ''}</span>
            </>
          )}
        </div>
        <div className="flex items-center">
          <span className="font-medium">{baths}</span>
          <span className="text-gray-500 ml-1">bath{baths !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center">
          <span className="font-medium">{sqft ? sqft.toLocaleString() : '1,000'}</span>
          <span className="text-gray-500 ml-1">sqft</span>
        </div>
      </div>
    </>
  );
};

export default PropertyCardDetails;
