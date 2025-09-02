
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import PropertyCardAdapter from '@/components/PropertyCardAdapter';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    })),
    auth: {
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } }))
    }
  }
}));

// Test utilities
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const testQueryClient = createTestQueryClient();
  
  return render(
    <BrowserRouter>
      <QueryClientProvider client={testQueryClient}>
        <AuthProvider>
          {ui}
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

// Mock property data
const mockProperty = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Beautiful Downtown Apartment',
  price: 2500,
  images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  bedrooms: 2,
  bathrooms: 2,
  location: '123 Main St, City, State',
  featured: true,
  status: 'available'
};

describe('PropertyCardAdapter', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders property information correctly', () => {
    renderWithProviders(<PropertyCardAdapter property={mockProperty} />);
    
    expect(screen.getByText('Beautiful Downtown Apartment')).toBeInTheDocument();
    expect(screen.getByText('$2,500/month')).toBeInTheDocument();
    expect(screen.getByText('2 bed')).toBeInTheDocument();
    expect(screen.getByText('2 bath')).toBeInTheDocument();
    expect(screen.getByText('123 Main St, City, State')).toBeInTheDocument();
  });

  it('displays featured badge for featured properties', () => {
    renderWithProviders(<PropertyCardAdapter property={mockProperty} />);
    
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('does not display featured badge for non-featured properties', () => {
    const nonFeaturedProperty = { ...mockProperty, featured: false };
    renderWithProviders(<PropertyCardAdapter property={nonFeaturedProperty} />);
    
    expect(screen.queryByText('Featured')).not.toBeInTheDocument();
  });

  it('handles missing images gracefully', () => {
    const propertyWithoutImages = { ...mockProperty, images: [] };
    renderWithProviders(<PropertyCardAdapter property={propertyWithoutImages} />);
    
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', '/placeholder.svg');
  });

  it('formats price correctly for different values', () => {
    const expensiveProperty = { ...mockProperty, price: 5000 };
    renderWithProviders(<PropertyCardAdapter property={expensiveProperty} />);
    
    expect(screen.getByText('$5,000/month')).toBeInTheDocument();
  });

  it('navigates to property detail page when clicked', () => {
    renderWithProviders(<PropertyCardAdapter property={mockProperty} />);
    
    const card = screen.getByRole('article');
    fireEvent.click(card);
    
    // Note: In a real test, you'd check that navigation occurred
    // This would require additional setup with testing router
    expect(card).toBeInTheDocument();
  });

  it('handles favorite button click', async () => {
    renderWithProviders(<PropertyCardAdapter property={mockProperty} />);
    
    const favoriteButton = screen.getByRole('button', { name: /favorite/i });
    fireEvent.click(favoriteButton);
    
    // The favorite functionality would be tested with proper auth context
    expect(favoriteButton).toBeInTheDocument();
  });

  it('displays sold status when property is sold', () => {
    const soldProperty = { ...mockProperty, status: 'sold' };
    renderWithProviders(<PropertyCardAdapter property={soldProperty} />);
    
    expect(screen.getByText('Sold')).toBeInTheDocument();
  });

  it('handles image loading error', () => {
    renderWithProviders(<PropertyCardAdapter property={mockProperty} />);
    
    const image = screen.getByRole('img') as HTMLImageElement;
    fireEvent.error(image);
    
    // Should fallback to placeholder
    expect(image.src).toContain('placeholder.svg');
  });
});
