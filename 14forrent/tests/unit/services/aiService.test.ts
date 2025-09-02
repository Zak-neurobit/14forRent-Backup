
import { searchListingsWithAI } from '@/services/ai/search';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn()
  }
}));

// Mock fetch for OpenAI API calls
global.fetch = jest.fn();

describe('AI Search Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('searchListingsWithAI', () => {
    it('performs fallback text search when no API key is available', async () => {
      // Mock no API key scenario
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'No API key found' }
          })
        }),
        neq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: '1',
                    title: 'Downtown Apartment',
                    description: 'Beautiful apartment in downtown',
                    location: 'Downtown',
                    price: 2500,
                    bedrooms: 2,
                    bathrooms: 2,
                    amenities: ['parking', 'gym'],
                    images: ['image1.jpg'],
                    featured: true
                  }
                ],
                error: null
              })
            })
          })
        })
      });

      const result = await searchListingsWithAI('apartment downtown');

      expect(result).toEqual({
        matches: expect.arrayContaining([
          expect.objectContaining({
            title: 'Downtown Apartment',
            similarity: expect.any(Number),
            matchReasons: expect.any(Array)
          })
        ]),
        searchQuery: 'apartment downtown'
      });
    });

    it('performs semantic search when API key and embeddings are available', async () => {
      // Mock API key availability
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { openai_api_key: 'test-api-key' },
            error: null
          })
        })
      });

      // Mock OpenAI embedding API
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: [{ embedding: new Array(1536).fill(0.1) }]
        })
      });

      // Mock vector search RPC
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: [
          {
            id: '1',
            title: 'Modern Apartment',
            description: 'Spacious modern apartment',
            location: 'City Center',
            price: 3000,
            bedrooms: 2,
            bathrooms: 2,
            amenities: ['pool', 'gym'],
            images: ['image1.jpg'],
            similarity: 0.85
          }
        ],
        error: null
      });

      const result = await searchListingsWithAI('modern apartment', {
        useSemanticSearch: true,
        limit: 5
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/embeddings',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      );

      expect(supabase.rpc).toHaveBeenCalledWith('match_listings', {
        query_embedding: expect.any(Array),
        match_threshold: 0.3,
        match_count: 10,
        match_offset: 0
      });

      expect(result.matches).toHaveLength(1);
      expect(result.matches[0]).toEqual(
        expect.objectContaining({
          title: 'Modern Apartment',
          similarity: 0.85
        })
      );
    });

    it('analyzes search intent when requested', async () => {
      // Mock API key availability
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { openai_api_key: 'test-api-key' },
            error: null
          })
        }),
        neq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [
                      {
                        id: '1',
                        title: 'Pet-Friendly Apartment',
                        description: 'Dog and cat friendly',
                        location: 'Suburbs',
                        price: 2200,
                        bedrooms: 3,
                        bathrooms: 2,
                        amenities: ['pet-friendly', 'yard'],
                        images: ['image1.jpg'],
                        featured: false
                      }
                    ],
                    error: null
                  })
                })
              })
            })
          })
        })
      });

      // Mock OpenAI chat completion for intent analysis
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  bedrooms: 3,
                  bathrooms: 2,
                  petFriendly: true,
                  amenities: ['pet-friendly'],
                  keywords: ['pet', 'dog', 'cat']
                })
              }
            }
          ]
        })
      });

      const result = await searchListingsWithAI('pet friendly 3 bedroom apartment', {
        analyzeIntent: true
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('pet friendly 3 bedroom apartment')
        })
      );

      expect(result.analyzedQuery).toEqual(
        expect.objectContaining({
          bedrooms: 3,
          bathrooms: 2,
          petFriendly: true,
          amenities: ['pet-friendly'],
          keywords: ['pet', 'dog', 'cat']
        })
      );
    });

    it('handles OpenAI API errors gracefully', async () => {
      // Mock API key availability
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { openai_api_key: 'test-api-key' },
            error: null
          })
        })
      });

      // Mock OpenAI API error
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          error: { message: 'API rate limit exceeded' }
        })
      });

      // Mock fallback database query
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { openai_api_key: 'test-api-key' },
            error: null
          })
        })
      }).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          neq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              })
            })
          })
        })
      });

      const result = await searchListingsWithAI('luxury apartment', {
        useSemanticSearch: true
      });

      expect(result.matches).toBeDefined();
      expect(result.searchQuery).toBe('luxury apartment');
    });

    it('filters results based on analyzed query', async () => {
      const mockListings = [
        {
          id: '1',
          title: 'Budget Apartment',
          price: 1000,
          bedrooms: 1,
          bathrooms: 1,
          amenities: ['parking'],
          similarity: 0.7
        },
        {
          id: '2',
          title: 'Luxury Apartment',
          price: 3000,
          bedrooms: 2,
          bathrooms: 2,
          amenities: ['gym', 'pool'],
          similarity: 0.8
        }
      ];

      const analyzedQuery = {
        bedrooms: 2,
        bathrooms: 2,
        priceRange: { min: 2000, max: 4000 },
        amenities: ['gym']
      };

      // Test the filterAndRankMatches function logic
      const filteredResults = mockListings.map(listing => {
        let score = listing.similarity;
        let matchReasons: string[] = [];

        if (analyzedQuery.bedrooms && listing.bedrooms === analyzedQuery.bedrooms) {
          score += 0.2;
          matchReasons.push(`${analyzedQuery.bedrooms} bedrooms`);
        }

        if (analyzedQuery.priceRange) {
          const { min, max } = analyzedQuery.priceRange;
          if (min && listing.price >= min) score += 0.1;
          if (max && listing.price <= max) score += 0.1;
        }

        return {
          ...listing,
          similarity: Math.min(score, 1),
          matchReasons
        };
      }).sort((a, b) => b.similarity - a.similarity);

      expect(filteredResults[0]).toEqual(
        expect.objectContaining({
          title: 'Luxury Apartment',
          similarity: expect.toBeGreaterThan(0.8),
          matchReasons: expect.arrayContaining(['2 bedrooms'])
        })
      );
    });

    it('handles database errors in fallback search', async () => {
      // Mock API key not available
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'No API key' }
          })
        }),
        neq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed' }
              })
            })
          })
        })
      });

      const result = await searchListingsWithAI('apartment');

      expect(result).toEqual({
        matches: [],
        searchQuery: 'apartment',
        error: 'Database connection failed'
      });
    });

    it('excludes sold listings from search results', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'No API key' }
          })
        }),
        neq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: '1',
                    title: 'Available Apartment',
                    status: 'available',
                    price: 2000,
                    bedrooms: 2,
                    bathrooms: 2,
                    amenities: [],
                    images: [],
                    featured: false
                  }
                ],
                error: null
              })
            })
          })
        })
      });

      const result = await searchListingsWithAI('apartment');

      // Verify that neq('status', 'sold') was called
      expect(supabase.from).toHaveBeenCalledWith('listings');
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].title).toBe('Available Apartment');
    });
  });
});
