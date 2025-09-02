import { PropertyListing } from "@/data/propertyListings";

export interface PropertyStructuredData {
  "@context": string;
  "@type": string;
  name: string;
  description: string;
  url: string;
  image?: string | string[];
  address: {
    "@type": string;
    streetAddress?: string;
    addressLocality: string;
    addressRegion: string;
    addressCountry: string;
    postalCode?: string;
  };
  geo?: {
    "@type": string;
    latitude: string;
    longitude: string;
  };
  floorSize?: {
    "@type": string;
    value: number;
    unitCode: string;
  };
  numberOfRooms?: number;
  numberOfBedrooms?: number;
  numberOfBathroomsTotal?: number;
  rentPrice?: {
    "@type": string;
    price: string;
    priceCurrency: string;
    unitCode: string;
  };
  datePosted?: string;
  availabilityStarts?: string;
}

export function generatePropertyStructuredData(property: PropertyListing): PropertyStructuredData {
  const baseUrl = "https://14forrent.com";
  
  return {
    "@context": "https://schema.org",
    "@type": "Apartment",
    name: property.title,
    description: property.description,
    url: `${baseUrl}/property/${property.id}`,
    image: property.images?.[0] ? property.images : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: property.location,
      addressLocality: "Los Angeles",
      addressRegion: "CA",
      addressCountry: "US"
    },
    numberOfBedrooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms,
    floorSize: property.sqft ? {
      "@type": "QuantitativeValue",
      value: property.sqft,
      unitCode: "SQF"
    } : undefined,
    rentPrice: {
      "@type": "MonetaryAmount",
      price: property.price.toString(),
      priceCurrency: "USD",
      unitCode: "MON"
    },
    datePosted: new Date().toISOString().split('T')[0],
    availabilityStarts: new Date().toISOString().split('T')[0]
  };
}

export function generateRealEstateListingStructuredData(property: PropertyListing): object {
  const baseUrl = "https://14forrent.com";
  
  // Process images to ensure proper URLs
  const images = property.images?.map(img => 
    img.startsWith('http') ? img : `${baseUrl}${img}`
  ).filter(Boolean) || [`${baseUrl}/placeholder.svg`];
  
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": `${baseUrl}/property/${property.id}`,
    name: property.title,
    description: property.description,
    url: `${baseUrl}/property/${property.id}`,
    image: images,
    datePosted: new Date().toISOString(),
    provider: {
      "@type": "Organization",
      name: "14ForRent",
      url: baseUrl,
      logo: `${baseUrl}/lovable-uploads/8ea6f0a3-c771-40fc-8eef-653ab9af47a2.png`,
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+1-323-774-4700",
        contactType: "customer service",
        email: "info@14forrent.com"
      }
    },
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: "USD",
      businessFunction: "LeaseOut",
      availability: "https://schema.org/InStock",
      validFrom: new Date().toISOString(),
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: property.price,
        priceCurrency: "USD",
        unitText: "MONTH"
      }
    },
    realestateListing: {
      "@type": "RealEstateListing",
      numberOfRooms: property.bedrooms,
      numberOfBathroomsTotal: property.bathrooms,
      floorSize: property.sqft ? {
        "@type": "QuantitativeValue",
        value: property.sqft,
        unitCode: "SQF"
      } : undefined,
      accommodationCategory: property.type || "Apartment"
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address || property.location,
      addressLocality: property.location || "Los Angeles",
      addressRegion: "CA",
      addressCountry: "US"
    },
    amenityFeature: property.amenities?.map(amenity => ({
      "@type": "LocationFeatureSpecification",
      name: amenity,
      value: true
    })) || []
  };
}