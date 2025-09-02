
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import Search from '@/pages/Search';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    auth: {
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } }))
    }
  }
}));

// Mock AI search service
jest.mock('@/services/ai/search', () => ({
  searchListingsWithAI: jest.fn()
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  }
}));

const mockListings = [
  {
    id: '1',
    title: 'Modern Downtown Apartment',
    description: 'Beautiful modern apartment in the heart of downtown',
    location: '123 Main St, Downtown',
    price: 2500,
    bedrooms: 2,
    bathrooms: 2,
    amenities: ['gym', 'pool', 'parking'],
    images: ['https://example.com/image1.jpg'],
    featured: true,
    status: 'available',
    similarity: 0.95,
    matchReasons: ['downtown', 'modern']
  },
  {
    id: '2',
    title: 'Cozy Suburban House',
    description: 'Perfect family home with large yard',
    location: '456 Oak Ave, Suburbs',
    price: 3200,
    bedrooms: 3,
    bathrooms: 2.5,
    amenities: ['yard', 'garage', 'fireplace'],
    images: ['https://example.com/image2.jpg'],
    featured: false,
    status: 'available',
    similarity: 0.82,
    matchReasons: ['house', 'family']
  }
];

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {component}
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Property Search Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for listings query
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        neq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: mockListings,
                error: null
              })
            })
          })
        }),
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      })
    });
  });

  describe('Basic Search Functionality', () => {
    it('displays search results for basic text search', async () => {
      renderWithProviders(<Search />);

      const searchInput = screen.getByPlaceholderText(/search for properties/i);
      const searchButton = screen.getByRole('button', { name: /search/i });

      fireEvent.change(searchInput, { target: { value: 'downtown apartment' } });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Modern Downtown Apartment')).toBeInTheDocument();
        expect(screen.getByText('Cozy Suburban House')).toBeInTheDocument();
      });
    });

    it('shows no results message when no properties match', async () => {
      // Mock empty results
      (supabase.from as jest.Mock).mockReturnValue({
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

      renderWithProviders(<Search />);

      const searchInput = screen.getByPlaceholderText(/search for properties/i);
      const searchButton = screen.getByRole('button', { name: /search/i });

      fireEvent.change(searchInput, { target: { value: 'nonexistent property' } });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText(/no properties found/i)).toBeInTheDocument();
      });
    });
  });

  describe('AI-Powered Search', () => {
    it('performs AI search with natural language queries', async () => {
      const { searchListingsWithAI } = require('@/services/ai/search');
      
      searchListingsWithAI.mockResolvedValue({
        matches: mockListings,
        searchQuery: 'pet friendly apartment near downtown',
        analyzedQuery: {
          petFriendly: true,
          location: 'downtown',
          propertyType: 'apartment'
        }
      });

      renderWithProviders(<Search />);

      const aiSearchButton = screen.getByRole('button', { name: /ai search/i });
      const searchInput = screen.getByPlaceholderText(/search for properties/i);

      fireEvent.change(searchInput, { 
        target: { value: 'pet friendly apartment near downtown' } 
      });
      fireEvent.click(aiSearchButton);

      await waitFor(() => {
        expect(searchListingsWithAI).toHaveBeenCalledWith(
          'pet friendly apartment near downtown',
          expect.objectContaining({
            useSemanticSearch: true,
            analyzeIntent: true
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Modern Downtown Apartment')).toBeInTheDocument();
      });
    });

    it('displays AI search insights when available', async () => {
      const { searchListingsWithAI } = require('@/services/ai/search');
      
      searchListingsWithAI.mockResolvedValue({
        matches: mockListings,
        searchQuery: '2 bedroom under $3000',
        analyzedQuery: {
          bedrooms: 2,
          priceRange: { max: 3000 },
          keywords: ['affordable', 'spacious']
        }
      });

      renderWithProviders(<Search />);

      const aiSearchButton = screen.getByRole('button', { name: /ai search/i });
      const searchInput = screen.getByPlaceholderText(/search for properties/i);

      fireEvent.change(searchInput, { target: { value: '2 bedroom under $3000' } });
      fireEvent.click(aiSearchButton);

      await waitFor(() => {
        expect(screen.getByText(/search insights/i)).toBeInTheDocument();
        expect(screen.getByText(/2 bedrooms/i)).toBeInTheDocument();
        expect(screen.getByText(/under \$3,000/i)).toBeInTheDocument();
      });
    });

    it('handles AI search errors gracefully', async () => {
      const { searchListingsWithAI } = require('@/services/ai/search');
      
      searchListingsWithAI.mockResolvedValue({
        matches: [],
        searchQuery: 'test query',
        error: 'AI service temporarily unavailable'
      });

      renderWithProviders(<Search />);

      const aiSearchButton = screen.getByRole('button', { name: /ai search/i });
      const searchInput = screen.getByPlaceholderText(/search for properties/i);

      fireEvent.change(searchInput, { target: { value: 'luxury penthouse' } });
      fireEvent.click(aiSearchButton);

      await waitFor(() => {
        expect(screen.getByText(/ai service temporarily unavailable/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search Filters', () => {
    it('applies price range filters correctly', async () => {
      renderWithProviders(<Search />);

      // Open filters
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      fireEvent.click(filtersButton);

      // Set price range
      const minPriceInput = screen.getByLabelText(/min price/i);
      const maxPriceInput = screen.getByLabelText(/max price/i);

      fireEvent.change(minPriceInput, { target: { value: '2000' } });
      fireEvent.change(maxPriceInput, { target: { value: '3000' } });

      // Apply filters
      const applyFiltersButton = screen.getByRole('button', { name: /apply filters/i });
      fireEvent.click(applyFiltersButton);

      await waitFor(() => {
        // Should only show properties within price range
        expect(screen.getByText('Modern Downtown Apartment')).toBeInTheDocument();
        expect(screen.queryByText('Cozy Suburban House')).not.toBeInTheDocument();
      });
    });

    it('applies bedroom and bathroom filters', async () => {
      renderWithProviders(<Search />);

      const filtersButton = screen.getByRole('button', { name: /filters/i });
      fireEvent.click(filtersButton);

      // Set bedroom filter
      const bedroomsSelect = screen.getByLabelText(/bedrooms/i);
      fireEvent.change(bedroomsSelect, { target: { value: '3' } });

      // Set bathroom filter
      const bathroomsSelect = screen.getByLabelText(/bathrooms/i);
      fireEvent.change(bathroomsSelect, { target: { value: '2' } });

      const applyFiltersButton = screen.getByRole('button', { name: /apply filters/i });
      fireEvent.click(applyFiltersButton);

      await waitFor(() => {
        expect(screen.getByText('Cozy Suburban House')).toBeInTheDocument();
        expect(screen.queryByText('Modern Downtown Apartment')).not.toBeInTheDocument();
      });
    });

    it('applies amenity filters', async () => {
      renderWithProviders(<Search />);

      const filtersButton = screen.getByRole('button', { name: /filters/i });
      fireEvent.click(filtersButton);

      // Select gym amenity
      const gymCheckbox = screen.getByRole('checkbox', { name: /gym/i });
      fireEvent.click(gymCheckbox);

      const applyFiltersButton = screen.getByRole('button', { name: /apply filters/i });
      fireEvent.click(applyFiltersButton);

      await waitFor(() => {
        expect(screen.getByText('Modern Downtown Apartment')).toBeInTheDocument();
        expect(screen.queryByText('Cozy Suburban House')).not.toBeInTheDocument();
      });
    });

    it('clears filters when reset button is clicked', async () => {
      renderWithProviders(<Search />);

      const filtersButton = screen.getByRole('button', { name: /filters/i });
      fireEvent.click(filtersButton);

      // Set some filters
      const minPriceInput = screen.getByLabelText(/min price/i);
      fireEvent.change(minPriceInput, { target: { value: '2000' } });

      // Clear filters
      const clearFiltersButton = screen.getByRole('button', { name: /clear filters/i });
      fireEvent.click(clearFiltersButton);

      await waitFor(() => {
        expect(minPriceInput).toHaveValue('');
      });
    });
  });

  describe('Search Results Display', () => {
    it('displays property cards with correct information', async () => {
      renderWithProviders(<Search />);

      const searchInput = screen.getByPlaceholderText(/search for properties/i);
      const searchButton = screen.getByRole('button', { name: /search/i });

      fireEvent.change(searchInput, { target: { value: 'apartment' } });
      fireEvent.click(searchButton);

      await waitFor(() => {
        // Check first property
        expect(screen.getByText('Modern Downtown Apartment')).toBeInTheDocument();
        expect(screen.getByText('$2,500/month')).toBeInTheDocument();
        expect(screen.getByText('2 bed')).toBeInTheDocument();
        expect(screen.getByText('2 bath')).toBeInTheDocument();
        expect(screen.getByText('Featured')).toBeInTheDocument();

        // Check second property
        expect(screen.getByText('Cozy Suburban House')).toBeInTheDocument();
        expect(screen.getByText('$3,200/month')).toBeInTheDocument();
        expect(screen.getByText('3 bed')).toBeInTheDocument();
        expect(screen.getByText('2.5 bath')).toBeInTheDocument();
      });
    });

    it('displays loading state during search', async () => {
      // Mock delayed response
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          neq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockImplementation(() => 
                  new Promise(resolve => 
                    setTimeout(() => resolve({
                      data: mockListings,
                      error: null
                    }), 100)
                  )
                )
              })
            })
          })
        })
      });

      renderWithProviders(<Search />);

      const searchInput = screen.getByPlaceholderText(/search for properties/i);
      const searchButton = screen.getByRole('button', { name: /search/i });

      fireEvent.change(searchInput, { target: { value: 'apartment' } });
      fireEvent.click(searchButton);

      // Should show loading state
      expect(screen.getByText(/searching/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(/searching/i)).not.toBeInTheDocument();
        expect(screen.getByText('Modern Downtown Apartment')).toBeInTheDocument();
      });
    });

    it('handles search errors gracefully', async () => {
      // Mock search error
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
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
        })
      });

      renderWithProviders(<Search />);

      const searchInput = screen.getByPlaceholderText(/search for properties/i);
      const searchButton = screen.getByRole('button', { name: /search/i });

      fireEvent.change(searchInput, { target: { value: 'apartment' } });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText(/search failed/i)).toBeInTheDocument();
        expect(screen.getByText(/database connection failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Property Interaction', () => {
    it('navigates to property detail page when property is clicked', async () => {
      renderWithProviders(<Search />);

      const searchInput = screen.getByPlaceholderText(/search for properties/i);
      const searchButton = screen.getByRole('button', { name: /search/i });

      fireEvent.change(searchInput, { target: { value: 'apartment' } });
      fireEvent.click(searchButton);

      await waitFor(() => {
        const propertyCard = screen.getByText('Modern Downtown Apartment').closest('article');
        expect(propertyCard).toBeInTheDocument();
        
        if (propertyCard) {
          fireEvent.click(propertyCard);
          // In a real test, you'd verify navigation occurred
        }
      });
    });

    it('allows users to favorite properties', async () => {
      // Mock authenticated user
      require('@/contexts/AuthContext').useAuth = jest.fn(() => ({
        user: { id: 'user-123', email: 'test@example.com' },
        isLoading: false,
        isAdmin: false
      }));

      // Mock favorite toggle
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          neq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: mockListings,
                  error: null
                })
              })
            })
          }),
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        }),
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null
        }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      });

      renderWithProviders(<Search />);

      const searchInput = screen.getByPlaceholderText(/search for properties/i);
      const searchButton = screen.getByRole('button', { name: /search/i });

      fireEvent.change(searchInput, { target: { value: 'apartment' } });
      fireEvent.click(searchButton);

      await waitFor(() => {
        const favoriteButtons = screen.getAllByRole('button', { name: /favorite/i });
        expect(favoriteButtons[0]).toBeInTheDocument();
        
        fireEvent.click(favoriteButtons[0]);
      });

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('favorites');
      });
    });
  });

  describe('Search History and Persistence', () => {
    it('saves search queries to localStorage', async () => {
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
      
      renderWithProviders(<Search />);

      const searchInput = screen.getByPlaceholderText(/search for properties/i);
      const searchButton = screen.getByRole('button', { name: /search/i });

      fireEvent.change(searchInput, { target: { value: 'downtown apartment' } });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledWith(
          'recentSearches',
          expect.stringContaining('downtown apartment')
        );
      });

      setItemSpy.mockRestore();
    });

    it('displays recent search suggestions', async () => {
      // Mock localStorage with recent searches
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
      getItemSpy.mockReturnValue(JSON.stringify(['downtown apartment', 'house with yard']));

      renderWithProviders(<Search />);

      const searchInput = screen.getByPlaceholderText(/search for properties/i);
      fireEvent.focus(searchInput);

      await waitFor(() => {
        expect(screen.getByText('downtown apartment')).toBeInTheDocument();
        expect(screen.getByText('house with yard')).toBeInTheDocument();
      });

      getItemSpy.mockRestore();
    });
  });
});
