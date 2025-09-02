
export interface AISearchOptions {
  model?: string;
  limit?: number;
  offset?: number;
  minSimilarity?: number;
  useSemanticSearch?: boolean;
  analyzeIntent?: boolean;
}

export interface MatchListingsResponse {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: string[];
  similarity: number;
  matchReasons?: string[];
}

export interface AISearchResult {
  matches: MatchListingsResponse[];
  searchQuery: string;
  error?: string;
  success?: boolean;
  interpretation?: {
    bedrooms?: number;
    bathrooms?: number;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    features?: string[];
  };
  analyzedQuery?: {
    bedrooms?: number;
    bathrooms?: number;
    priceRange?: { min?: number; max?: number };
    amenities?: string[];
    propertyType?: string;
    petFriendly?: boolean;
    keywords?: string[];
    location?: string;
  };
}
