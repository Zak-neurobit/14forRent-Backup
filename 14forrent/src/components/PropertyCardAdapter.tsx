import { Link } from "react-router-dom";
import PropertyCard from "./PropertyCard";

interface Property {
  id: string;
  title: string;
  price: number | string;
  address?: string;
  location?: string;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  baths?: number;
  sqft?: number;
  images?: string[];
  image?: string;
  featured?: boolean;
  manageable?: boolean;
  status?: string;
}

interface PropertyCardAdapterProps {
  property: Property;
  manageable?: boolean;
}

const PropertyCardAdapter = ({ property, manageable = false }: PropertyCardAdapterProps) => {
  // Enhanced image processing to handle Supabase Storage URLs and prevent blob URLs
  const processImages = (images?: string[], mainImage?: string): string[] => {
    const allImages: string[] = [];
    
    // Process storage URL to full URL
    const processStorageUrl = (url: string): string => {
      if (!url || typeof url !== 'string') {
        console.log('Invalid URL input:', url);
        return '';
      }
      
      const trimmed = url.trim();
      
      // Skip invalid URLs including blob URLs
      if (trimmed === '' || 
          trimmed === '/placeholder.svg' || 
          trimmed === 'placeholder.svg' ||
          trimmed.includes('undefined') ||
          trimmed.includes('null') ||
          trimmed.startsWith('blob:')) {
        console.log('Skipping invalid URL:', trimmed);
        return '';
      }
      
      // If it's already a full URL, return as is
      if (trimmed.startsWith('http')) {
        console.log('Using full URL as-is:', trimmed);
        return trimmed;
      }
      
      // If it's a direct file in the property_images bucket (no folder structure)
      if (!trimmed.includes('/') && !trimmed.startsWith('/')) {
        const fullUrl = `https://hdigtojmeagwaqdknblj.supabase.co/storage/v1/object/public/property_images/${trimmed}`;
        console.log('Converting direct file to full URL:', trimmed, '->', fullUrl);
        return fullUrl;
      }
      
      // If it's a storage path with the correct bucket name, construct the full URL
      if (trimmed.startsWith('property_images/')) {
        const fullUrl = `https://hdigtojmeagwaqdknblj.supabase.co/storage/v1/object/public/${trimmed}`;
        console.log('Converting storage path to full URL:', trimmed, '->', fullUrl);
        return fullUrl;
      }
      
      // If it starts with a slash, treat as relative path
      if (trimmed.startsWith('/')) {
        console.log('Using relative path:', trimmed);
        return trimmed;
      }
      
      console.log('Using URL as-is:', trimmed);
      return trimmed;
    };
    
    // Add images from array if they exist and are valid
    if (images && Array.isArray(images)) {
      const validImages = images
        .map(processStorageUrl)
        .filter(url => url !== '');
      allImages.push(...validImages);
      console.log('Processed images array for property', property.id, ':', images, '->', validImages);
    }
    
    // Add main image if it's valid and not already included
    if (mainImage && typeof mainImage === 'string') {
      const processedMainImage = processStorageUrl(mainImage);
      if (processedMainImage !== '' && !allImages.includes(processedMainImage)) {
        allImages.unshift(processedMainImage); // Add to beginning
        console.log('Added main image for property', property.id, ':', mainImage, '->', processedMainImage);
      }
    }
    
    // Return valid images or fallback to placeholder
    const finalImages = allImages.length > 0 ? allImages : ['/placeholder.svg'];
    console.log('Final processed images for property', property.id, ':', finalImages);
    return finalImages;
  };

  // Process and validate images
  const processedImages = processImages(property.images, property.image);
  
  // Format price consistently
  const formatPrice = (price: number | string): string => {
    if (typeof price === 'string') {
      // Handle string prices like "P.O.A" or already formatted prices
      if (price.includes('$') || isNaN(Number(price))) {
        return price;
      }
      return `$${Number(price).toLocaleString()}`;
    }
    return `$${price.toLocaleString()}`;
  };

  return (
    <PropertyCard
      id={property.id}
      image={processedImages[0]} // Main image
      images={processedImages} // All images
      title={property.title}
      price={formatPrice(property.price)}
      beds={property.bedrooms || property.beds || 0}
      baths={property.bathrooms || property.baths || 0}
      sqft={property.sqft || 1000}
      address={property.address || property.location || "Address not available"}
      featured={property.featured || false}
      manageable={manageable}
    />
  );
};

export default PropertyCardAdapter;
