import { supabase } from "@/integrations/supabase/client";
import { AISearchOptions, MatchListingsResponse, AISearchResult } from "./types";
import { toast } from "sonner";

/**
 * Searches listings using AI-powered vector search with enhanced NLP
 * @param searchQuery User's natural language search query
 * @param options Additional search options including semantic search
 * @returns Promise with matched listings
 */
export async function searchListingsWithAI(
  searchQuery: string, 
  options: AISearchOptions & { useSemanticSearch?: boolean; analyzeIntent?: boolean } = {}
): Promise<AISearchResult> {
  try {
    console.log("Starting enhanced AI search with query:", searchQuery);

    // First try to get an API key for OpenAI
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('ai_settings')
      .select('openai_api_key')
      .single();

    if (apiKeyError || !apiKeyData?.openai_api_key) {
      console.log("No OpenAI API key found, falling back to direct search");
      return fallbackTextSearch(searchQuery, options);
    }

    const openAIKey = apiKeyData.openai_api_key;

    // Enhanced AI analysis if requested
    let analyzedQuery = null;
    if (options.analyzeIntent) {
      analyzedQuery = await analyzeSearchQuery(searchQuery, openAIKey);
      console.log("Analyzed query:", analyzedQuery);
    }

    // Use semantic search if available
    if (options.useSemanticSearch) {
      try {
        console.log("Using semantic search with embeddings");
        const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openAIKey}`
          },
          body: JSON.stringify({
            input: searchQuery,
            model: "text-embedding-3-small"
          })
        });

        if (!embeddingResponse.ok) {
          console.error("Failed to generate embedding, falling back");
          return enhancedTextSearch(searchQuery, analyzedQuery, options);
        }

        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data[0].embedding;

        // Use the embedding to find similar listings
        const { limit = 10, offset = 0, minSimilarity = 0.3 } = options;

        console.log("Searching with semantic embeddings");
        const { data, error } = await supabase.rpc('match_listings', {
          query_embedding: embedding,
          match_threshold: minSimilarity,
          match_count: limit * 2,
          match_offset: offset
        });

        if (error) {
          console.error("Error in semantic search:", error);
          return enhancedTextSearch(searchQuery, analyzedQuery, options);
        }

        // Filter and rank results based on analyzed query requirements
        const filteredMatches = filterAndRankMatches(data as MatchListingsResponse[], analyzedQuery);
        
        console.log("Semantic search found matches:", filteredMatches.length);
        
        return {
          matches: filteredMatches.slice(0, limit),
          searchQuery,
          analyzedQuery
        };
      } catch (error) {
        console.error("Error in semantic search:", error);
        return enhancedTextSearch(searchQuery, analyzedQuery, options);
      }
    }

    // Fall back to enhanced text search with AI analysis
    return enhancedTextSearch(searchQuery, analyzedQuery, options);

  } catch (error) {
    console.error("Error in AI search:", error);
    return fallbackTextSearch(searchQuery, options);
  }
}

/**
 * Enhanced text search using AI analysis
 */
async function enhancedTextSearch(
  searchQuery: string, 
  analyzedQuery: any, 
  options: AISearchOptions = {}
): Promise<AISearchResult> {
  try {
    console.log("Using enhanced text search with AI analysis");
    const { limit = 10 } = options;

    // Build smart query based on AI analysis
    let query = supabase.from('listings').select('*').neq('status', 'sold'); // Exclude sold listings
    
    if (analyzedQuery) {
      // Apply filters based on AI analysis
      if (analyzedQuery.bedrooms) {
        query = query.eq('bedrooms', analyzedQuery.bedrooms);
      }
      if (analyzedQuery.bathrooms) {
        query = query.gte('bathrooms', analyzedQuery.bathrooms);
      }
      if (analyzedQuery.priceRange?.min) {
        query = query.gte('price', analyzedQuery.priceRange.min);
      }
      if (analyzedQuery.priceRange?.max) {
        query = query.lte('price', analyzedQuery.priceRange.max);
      }
    }

    const { data, error } = await query
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error("Error in enhanced search:", error);
      return fallbackTextSearch(searchQuery, options);
    }

    // Score and filter results
    const scoredListings = data.map(listing => {
      const text = `${listing.title} ${listing.description} ${listing.location} ${listing.amenities?.join(' ') || ''}`.toLowerCase();
      const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 2);
      
      let score = 0;
      let matchedTerms: string[] = [];
      let matchReasons: string[] = [];
      
      // Basic text matching
      searchTerms.forEach(term => {
        if (text.includes(term)) {
          score += 1;
          matchedTerms.push(term);
        }
      });
      
      // AI-based filtering for specific criteria
      if (analyzedQuery) {
        // Pet-friendly check
        if (analyzedQuery.petFriendly) {
          const petTerms = ['pet', 'dog', 'cat', 'animal'];
          const isPetFriendly = petTerms.some(term => text.includes(term));
          if (isPetFriendly) {
            score += 3;
            matchReasons.push('pet-friendly');
          }
        }
        
        // Amenity matching
        if (analyzedQuery.amenities?.length > 0) {
          const matchingAmenities = analyzedQuery.amenities.filter((amenity: string) => 
            text.includes(amenity.toLowerCase())
          );
          if (matchingAmenities.length > 0) {
            score += matchingAmenities.length * 2;
            matchReasons.push(...matchingAmenities);
          }
        }
        
        // Keyword matching
        if (analyzedQuery.keywords?.length > 0) {
          const matchingKeywords = analyzedQuery.keywords.filter((keyword: string) => 
            text.includes(keyword.toLowerCase())
          );
          if (matchingKeywords.length > 0) {
            score += matchingKeywords.length;
            matchReasons.push(...matchingKeywords);
          }
        }
      }
      
      // Boost featured listings
      if (listing.featured) {
        score += 0.5;
      }
      
      return { 
        ...listing,
        similarity: searchTerms.length > 0 ? score / (searchTerms.length + 2) : score / 5,
        matchReasons: [...matchedTerms, ...matchReasons]
      };
    });

    // Sort by score and filter out low scores
    const matches = scoredListings
      .filter(item => item.similarity > 0.1)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    console.log("Enhanced search found matches:", matches.length);
    
    return {
      matches,
      searchQuery,
      analyzedQuery
    };
  } catch (error) {
    console.error("Error in enhanced text search:", error);
    return fallbackTextSearch(searchQuery, options);
  }
}

/**
 * Analyze search query using AI to extract specific requirements
 */
async function analyzeSearchQuery(searchQuery: string, openAIKey: string) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAIKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a real estate search assistant. Analyze the user's search query and extract specific requirements. Return a JSON object with the following structure:
            {
              "bedrooms": number or null,
              "bathrooms": number or null,
              "priceRange": {"min": number or null, "max": number or null},
              "amenities": ["pool", "gym", "parking", etc.],
              "propertyType": "apartment", "house", "villa", etc. or null,
              "petFriendly": boolean or null,
              "keywords": ["modern", "luxury", "downtown", etc.],
              "location": string or null
            }
            
            Common amenities to look for: pool, gym, parking, balcony, garden, security, elevator, air conditioning, heating, laundry, dishwasher, wifi, furnished.
            Look for pet-related terms like "pet friendly", "pets allowed", "dog", "cat".
            Extract price ranges from terms like "under $2000", "between $1500-2500", "max $3000".
            Extract only what's explicitly mentioned or strongly implied in the query.`
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      console.error("Failed to analyze query");
      return null;
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse analyzed query:", content);
      return null;
    }
  } catch (error) {
    console.error("Error analyzing search query:", error);
    return null;
  }
}

/**
 * Filter and rank matches based on analyzed query requirements
 */
function filterAndRankMatches(matches: MatchListingsResponse[], analyzedQuery: any): MatchListingsResponse[] {
  if (!analyzedQuery) return matches;

  return matches.map(match => {
    let score = match.similarity;
    let matchReasons: string[] = [];

    // Check bedrooms
    if (analyzedQuery.bedrooms && match.bedrooms === analyzedQuery.bedrooms) {
      score += 0.2;
      matchReasons.push(`${analyzedQuery.bedrooms} bedrooms`);
    }

    // Check bathrooms
    if (analyzedQuery.bathrooms && match.bathrooms >= analyzedQuery.bathrooms) {
      score += 0.15;
      matchReasons.push(`${match.bathrooms} bathrooms`);
    }

    // Check price range
    if (analyzedQuery.priceRange) {
      const { min, max } = analyzedQuery.priceRange;
      if (min && match.price >= min) score += 0.1;
      if (max && match.price <= max) score += 0.1;
      if (min && max && match.price >= min && match.price <= max) {
        matchReasons.push('within price range');
      }
    }

    // Check amenities
    if (analyzedQuery.amenities && analyzedQuery.amenities.length > 0 && match.amenities) {
      const matchingAmenities = analyzedQuery.amenities.filter((amenity: string) => 
        match.amenities.some((listingAmenity: string) => 
          listingAmenity.toLowerCase().includes(amenity.toLowerCase())
        )
      );
      
      if (matchingAmenities.length > 0) {
        score += matchingAmenities.length * 0.15;
        matchReasons.push(...matchingAmenities);
      }
    }

    // Check pet friendly
    if (analyzedQuery.petFriendly && match.amenities) {
      const isPetFriendly = match.amenities.some((amenity: string) => 
        amenity.toLowerCase().includes('pet') || 
        amenity.toLowerCase().includes('dog') ||
        amenity.toLowerCase().includes('cat')
      );
      if (isPetFriendly) {
        score += 0.25;
        matchReasons.push('pet friendly');
      }
    }

    // Check keywords in title and description
    if (analyzedQuery.keywords && analyzedQuery.keywords.length > 0) {
      const text = `${match.title} ${match.description}`.toLowerCase();
      const matchingKeywords = analyzedQuery.keywords.filter((keyword: string) => 
        text.includes(keyword.toLowerCase())
      );
      
      if (matchingKeywords.length > 0) {
        score += matchingKeywords.length * 0.08;
        matchReasons.push(...matchingKeywords);
      }
    }

    return {
      ...match,
      similarity: Math.min(score, 1),
      matchReasons
    };
  }).sort((a, b) => b.similarity - a.similarity);
}

/**
 * Fallback function for when vector search is not available
 */
async function fallbackTextSearch(
  searchQuery: string,
  options: AISearchOptions = {}
): Promise<AISearchResult> {
  console.log("Using fallback text search for:", searchQuery);
  try {
    const { limit = 10 } = options;
    const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 2);

    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .neq('status', 'sold') // Exclude sold listings
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error("Error in fallback search:", error);
      return {
        matches: [],
        searchQuery,
        error: error.message
      };
    }

    const scoredListings = data.map(listing => {
      const text = `${listing.title} ${listing.description} ${listing.location} ${listing.amenities?.join(' ') || ''}`.toLowerCase();
      
      let score = 0;
      let matchedTerms: string[] = [];
      
      searchTerms.forEach(term => {
        if (text.includes(term)) {
          score += 1;
          matchedTerms.push(term);
        }
      });
      
      if (listing.featured) {
        score += 0.5;
      }
      
      return { 
        ...listing,
        similarity: score / searchTerms.length,
        matchReasons: matchedTerms
      };
    });

    const matches = scoredListings
      .filter(item => item.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    console.log("Fallback search found matches:", matches.length);
    
    return {
      matches,
      searchQuery
    };
  } catch (error) {
    console.error("Error in fallback search:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    return {
      matches: [],
      searchQuery,
      error: errorMessage
    };
  }
}
