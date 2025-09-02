// SEO Helper utilities for generating structured data and meta tags

export interface PropertyData {
  id: string;
  title: string;
  description: string;
  price: number;
  address?: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  sqft?: number;
  type?: string;
  images?: string[];
  amenities?: string[];
  available?: boolean;
  datePosted?: string;
  landlordName?: string;
  landlordPhone?: string;
  landlordEmail?: string;
}

/**
 * Generate RealEstateListing schema for a rental property
 * Following Google's latest requirements for rental listings
 */
export const generatePropertySchema = (property: PropertyData) => {
  const baseUrl = 'https://14forrent.com';
  const propertyUrl = `${baseUrl}/property/${property.id}`;
  
  // Main image with fallback
  const mainImage = property.images && property.images.length > 0 
    ? property.images[0].startsWith('http') 
      ? property.images[0] 
      : `${baseUrl}${property.images[0]}`
    : `${baseUrl}/placeholder.svg`;

  // Base schema for RealEstateListing
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": propertyUrl,
    "name": property.title,
    "description": property.description,
    "url": propertyUrl,
    "datePosted": property.datePosted || new Date().toISOString(),
    "image": property.images?.map(img => 
      img.startsWith('http') ? img : `${baseUrl}${img}`
    ) || [mainImage],
    "offers": {
      "@type": "Offer",
      "price": property.price,
      "priceCurrency": "USD",
      "businessFunction": "LeaseOut",
      "availability": property.available !== false ? "InStock" : "OutOfStock",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": property.price,
        "priceCurrency": "USD",
        "unitText": "MONTH"
      }
    },
    "realestateListing": {
      "@type": "RealEstateListing",
      "numberOfRooms": property.bedrooms,
      "numberOfBathroomsTotal": property.bathrooms,
      "floorSize": property.sqft ? {
        "@type": "QuantitativeValue",
        "value": property.sqft,
        "unitCode": "SQF"
      } : undefined
    }
  };

  // Add address information
  if (property.address || property.location) {
    schema.address = {
      "@type": "PostalAddress",
      "streetAddress": property.address,
      "addressLocality": property.location,
      "addressRegion": "CA",
      "addressCountry": "US"
    };
  }

  // Add property type
  if (property.type) {
    schema.accommodationCategory = property.type;
  }

  // Add amenities if available
  if (property.amenities && property.amenities.length > 0) {
    schema.amenityFeature = property.amenities.map(amenity => ({
      "@type": "LocationFeatureSpecification",
      "name": amenity,
      "value": true
    }));
  }

  // Add landlord/agent information if available
  if (property.landlordName || property.landlordEmail || property.landlordPhone) {
    schema.landlord = {
      "@type": "Person",
      "name": property.landlordName || "14ForRent",
      "email": property.landlordEmail || "info@14forrent.com",
      "telephone": property.landlordPhone || "+1-323-774-4700"
    };
  }

  // Add organization as the listing agent
  schema.provider = {
    "@type": "Organization",
    "name": "14ForRent",
    "url": baseUrl,
    "logo": `${baseUrl}/lovable-uploads/8ea6f0a3-c771-40fc-8eef-653ab9af47a2.png`,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+1-323-774-4700",
      "contactType": "customer service",
      "email": "info@14forrent.com"
    }
  };

  return schema;
};

/**
 * Generate FAQPage schema for common property questions
 */
export const generateFAQSchema = (questions: Array<{ question: string; answer: string }>) => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": questions.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };
};

/**
 * Generate WebPage schema with breadcrumbs
 */
export const generateWebPageSchema = (
  title: string,
  description: string,
  url: string,
  breadcrumbs?: Array<{ name: string; url: string }>
) => {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": title,
    "description": description,
    "url": url,
    "inLanguage": "en-US",
    "isPartOf": {
      "@type": "WebSite",
      "name": "14ForRent",
      "url": "https://14forrent.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "14ForRent",
      "logo": {
        "@type": "ImageObject",
        "url": "https://14forrent.com/lovable-uploads/8ea6f0a3-c771-40fc-8eef-653ab9af47a2.png"
      }
    }
  };

  if (breadcrumbs && breadcrumbs.length > 0) {
    schema.breadcrumb = {
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": item.url
      }))
    };
  }

  return schema;
};

/**
 * Generate SearchAction schema for site search
 */
export const generateSearchActionSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "14ForRent",
    "url": "https://14forrent.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://14forrent.com/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };
};

/**
 * Generate LocalBusiness schema for the rental agency
 */
export const generateLocalBusinessSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "14ForRent",
    "description": "AI-powered rental property platform serving Los Angeles area",
    "url": "https://14forrent.com",
    "logo": "https://14forrent.com/lovable-uploads/8ea6f0a3-c771-40fc-8eef-653ab9af47a2.png",
    "image": "https://14forrent.com/lovable-uploads/8ea6f0a3-c771-40fc-8eef-653ab9af47a2.png",
    "telephone": "+1-323-774-4700",
    "email": "info@14forrent.com",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Los Angeles",
      "addressRegion": "CA",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "34.0522",
      "longitude": "-118.2437"
    },
    "areaServed": {
      "@type": "City",
      "name": "Los Angeles"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "18:00"
    },
    "priceRange": "$$",
    "sameAs": [
      "https://www.facebook.com/14ForRent",
      "https://www.instagram.com/14ForRent",
      "https://www.linkedin.com/company/14forrent/",
      "https://x.com/14ForRent",
      "https://www.yelp.com/biz/14-for-rent-llc-los-angeles-2",
      "https://www.youtube.com/@14ForRent"
    ]
  };
};

/**
 * Check if a page should be indexed based on its path
 */
export const shouldIndexPage = (pathname: string): boolean => {
  // Pages that should NOT be indexed
  const noIndexPaths = [
    '/login',
    '/signup',
    '/admin',
    '/profile',
    '/my-listings',
    '/owner-dashboard',
    '/list', // Property creation pages
    '/edit',
    '/welcome-back'
  ];

  // Check if current path starts with any noindex path
  return !noIndexPaths.some(path => pathname.startsWith(path));
};

/**
 * Generate meta description from property data
 */
export const generatePropertyMetaDescription = (property: PropertyData): string => {
  const parts = [];
  
  if (property.bedrooms) {
    parts.push(`${property.bedrooms} bedroom`);
  }
  
  if (property.type) {
    parts.push(property.type.toLowerCase());
  } else {
    parts.push('rental');
  }
  
  parts.push(`for $${property.price.toLocaleString()}/month`);
  
  if (property.location) {
    parts.push(`in ${property.location}`);
  }
  
  if (property.sqft) {
    parts.push(`with ${property.sqft.toLocaleString()} sqft`);
  }
  
  if (property.amenities && property.amenities.length > 0) {
    parts.push(`featuring ${property.amenities.slice(0, 2).join(', ')}`);
  }
  
  const baseDescription = parts.join(' ');
  const suffix = '. View photos, schedule tours, and apply online at 14ForRent.';
  
  // Ensure description stays under 155 characters for optimal display
  if (baseDescription.length + suffix.length > 155) {
    return baseDescription.substring(0, 155 - suffix.length - 3) + '...' + suffix;
  }
  
  return baseDescription + suffix;
};

/**
 * Generate keywords from property data
 */
export const generatePropertyKeywords = (property: PropertyData): string => {
  const keywords = [
    'rental property',
    property.location,
    `${property.bedrooms} bedroom`,
    `${property.bathrooms} bathroom`,
    property.type?.toLowerCase(),
    'apartment for rent',
    'house for rent',
    'Los Angeles rentals',
    '14ForRent'
  ].filter(Boolean);
  
  if (property.amenities && property.amenities.length > 0) {
    keywords.push(...property.amenities.slice(0, 3).map(a => a.toLowerCase()));
  }
  
  return keywords.join(', ');
};