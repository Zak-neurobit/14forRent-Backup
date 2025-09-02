
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { usePropertyForm } from '@/hooks/usePropertyForm';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  }
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => Promise.resolve({ 
        data: [{ id: 'test-id' }], 
        error: null 
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: { openai_api_key: 'test-key' }, 
            error: null 
          }))
        }))
      }))
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ 
          data: { path: 'test-path' }, 
          error: null 
        })),
        getPublicUrl: jest.fn(() => ({ 
          data: { publicUrl: 'https://example.com/image.jpg' } 
        }))
      }))
    }
  }
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    isLoading: false,
    isAdmin: false
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children
}));

// Test wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('usePropertyForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with default form values', () => {
    const { result } = renderHook(() => usePropertyForm(), {
      wrapper: createWrapper()
    });

    expect(result.current.form.getValues()).toEqual({
      title: '',
      location: '',
      description: '',
      price: 0,
      bedrooms: 1,
      bathrooms: 1,
      amenities: [],
      images: null,
      sqft: 1000,
      address: '',
      type: 'Apartment',
      youtube_url: ''
    });
  });

  it('handles image upload correctly', async () => {
    const { result } = renderHook(() => usePropertyForm(), {
      wrapper: createWrapper()
    });

    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    await act(async () => {
      result.current.setImageFiles([mockFile]);
    });

    expect(result.current.imageFiles).toEqual([mockFile]);
  });

  it('generates AI description when requested', async () => {
    // Mock fetch for OpenAI API
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'AI-generated description' } }]
        }),
      })
    ) as jest.Mock;

    const { result } = renderHook(() => usePropertyForm(), {
      wrapper: createWrapper()
    });

    // Set up form data
    act(() => {
      result.current.form.setValue('title', 'Test Property');
      result.current.form.setValue('location', 'Test Location');
      result.current.form.setValue('price', 2000);
      result.current.form.setValue('bedrooms', 2);
      result.current.form.setValue('bathrooms', 2);
      result.current.form.setValue('amenities', ['parking', 'gym']);
    });

    await act(async () => {
      await result.current.generateAIDescription();
    });

    await waitFor(() => {
      expect(result.current.form.getValues().description).toBe('AI-generated description');
    });

    expect(result.current.generatingDescription).toBe(false);
  });

  it('handles AI description generation error', async () => {
    // Mock fetch to simulate API error
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: { message: 'API Error' } }),
      })
    ) as jest.Mock;

    const { result } = renderHook(() => usePropertyForm(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      await result.current.generateAIDescription();
    });

    expect(toast.error).toHaveBeenCalledWith(
      'Failed to generate AI description',
      expect.objectContaining({
        description: 'API Error'
      })
    );
  });

  it('submits form with correct data', async () => {
    const { result } = renderHook(() => usePropertyForm(), {
      wrapper: createWrapper()
    });

    const formData = {
      title: 'Test Property',
      location: 'Test Location',
      description: 'Test Description',
      price: 2000,
      bedrooms: 2,
      bathrooms: 2,
      amenities: ['parking'],
      images: null,
      sqft: 1200,
      address: 'Test Address',
      type: 'House',
      youtube_url: 'https://youtube.com/watch?v=test'
    };

    await act(async () => {
      await result.current.onSubmit(formData);
    });

    expect(toast.success).toHaveBeenCalledWith('Property listed successfully!');
  });

  it('handles form submission error', async () => {
    // Mock Supabase to return error
    const mockSupabase = require('@/integrations/supabase/client').supabase;
    mockSupabase.from.mockReturnValue({
      insert: jest.fn(() => Promise.resolve({ 
        data: null, 
        error: { message: 'Database error' } 
      }))
    });

    const { result } = renderHook(() => usePropertyForm(), {
      wrapper: createWrapper()
    });

    const formData = {
      title: 'Test Property',
      location: 'Test Location',
      description: 'Test Description',
      price: 2000,
      bedrooms: 2,
      bathrooms: 2,
      amenities: ['parking'],
      images: null,
      sqft: 1200,
      address: 'Test Address',
      type: 'House',
      youtube_url: ''
    };

    await act(async () => {
      await result.current.onSubmit(formData);
    });

    expect(toast.error).toHaveBeenCalledWith(
      'Failed to create listing',
      expect.objectContaining({
        description: 'Database error'
      })
    );
  });

  it('handles video URL correctly', () => {
    const { result } = renderHook(() => usePropertyForm(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.setVideoUrl('https://youtube.com/watch?v=test123');
    });

    expect(result.current.videoUrl).toBe('https://youtube.com/watch?v=test123');
  });

  it('manages loading states correctly', async () => {
    const { result } = renderHook(() => usePropertyForm(), {
      wrapper: createWrapper()
    });

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.generatingDescription).toBe(false);

    // Test AI description loading state
    global.fetch = jest.fn(() =>
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: 'AI description' } }]
          }),
        }), 100)
      )
    ) as jest.Mock;

    act(() => {
      result.current.form.setValue('title', 'Test');
      result.current.form.setValue('location', 'Test');
      result.current.generateAIDescription();
    });

    expect(result.current.generatingDescription).toBe(true);

    await waitFor(() => {
      expect(result.current.generatingDescription).toBe(false);
    });
  });
});
