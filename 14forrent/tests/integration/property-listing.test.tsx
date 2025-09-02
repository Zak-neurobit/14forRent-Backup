
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ListProperty from '@/pages/ListProperty';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    storage: {
      from: jest.fn()
    },
    auth: {
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
      getSession: jest.fn(() => Promise.resolve({ 
        data: { 
          session: { 
            user: { id: 'user-123', email: 'test@example.com' } 
          } 
        } 
      }))
    }
  }
}));

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

// Mock file upload
Object.defineProperty(window, 'File', {
  value: class File {
    constructor(public parts: any[], public name: string, public options?: any) {}
  }
});

Object.defineProperty(window, 'FileList', {
  value: class FileList {
    [index: number]: File;
    length: number;
    constructor(files: File[]) {
      files.forEach((file, index) => {
        this[index] = file;
      });
      this.length = files.length;
    }
    item(index: number) {
      return this[index];
    }
  }
});

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

describe('Property Listing Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful database operations by default
    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockResolvedValue({
        data: [{ id: 'listing-123' }],
        error: null
      }),
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { openai_api_key: 'test-key' },
          error: null
        })
      })
    });

    // Mock storage operations
    (supabase.storage.from as jest.Mock).mockReturnValue({
      upload: jest.fn().mockResolvedValue({
        data: { path: 'property_images/test.jpg' },
        error: null
      }),
      getPublicUrl: jest.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/test.jpg' }
      })
    });
  });

  describe('Form Rendering and Validation', () => {
    it('renders all required form fields', async () => {
      renderWithProviders(<ListProperty />);

      await waitFor(() => {
        expect(screen.getByLabelText(/property title/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/monthly rent/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/bedrooms/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/bathrooms/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      });
    });

    it('validates required fields on form submission', async () => {
      renderWithProviders(<ListProperty />);

      const submitButton = screen.getByRole('button', { name: /create listing/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
        expect(screen.getByText(/location is required/i)).toBeInTheDocument();
        expect(screen.getByText(/description is required/i)).toBeInTheDocument();
      });

      // Should not call API with invalid form
      expect(supabase.from).not.toHaveBeenCalledWith('listings');
    });

    it('validates minimum price requirement', async () => {
      renderWithProviders(<ListProperty />);

      const priceInput = screen.getByLabelText(/monthly rent/i);
      fireEvent.change(priceInput, { target: { value: '0' } });

      const submitButton = screen.getByRole('button', { name: /create listing/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/price must be greater than 0/i)).toBeInTheDocument();
      });
    });

    it('validates description minimum length', async () => {
      renderWithProviders(<ListProperty />);

      const descriptionInput = screen.getByLabelText(/description/i);
      fireEvent.change(descriptionInput, { target: { value: 'Short' } });

      const submitButton = screen.getByRole('button', { name: /create listing/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/description must be at least 20 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Property Information Input', () => {
    it('accepts valid property information', async () => {
      renderWithProviders(<ListProperty />);

      // Fill in all required fields
      fireEvent.change(screen.getByLabelText(/property title/i), {
        target: { value: 'Beautiful Downtown Apartment' }
      });
      fireEvent.change(screen.getByLabelText(/location/i), {
        target: { value: '123 Main St, City, State' }
      });
      fireEvent.change(screen.getByLabelText(/monthly rent/i), {
        target: { value: '2500' }
      });
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'This is a beautiful apartment in the heart of downtown with modern amenities.' }
      });

      // Set bedrooms and bathrooms
      fireEvent.change(screen.getByLabelText(/bedrooms/i), {
        target: { value: '2' }
      });
      fireEvent.change(screen.getByLabelText(/bathrooms/i), {
        target: { value: '2' }
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create listing/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('listings');
      });
    });

    it('handles amenity selection correctly', async () => {
      renderWithProviders(<ListProperty />);

      // Select some amenities
      const gymCheckbox = screen.getByLabelText(/gym/i);
      const poolCheckbox = screen.getByLabelText(/pool/i);
      const parkingCheckbox = screen.getByLabelText(/parking/i);

      fireEvent.click(gymCheckbox);
      fireEvent.click(poolCheckbox);
      fireEvent.click(parkingCheckbox);

      expect(gymCheckbox).toBeChecked();
      expect(poolCheckbox).toBeChecked();
      expect(parkingCheckbox).toBeChecked();

      // Uncheck one amenity
      fireEvent.click(gymCheckbox);
      expect(gymCheckbox).not.toBeChecked();
    });

    it('handles property type selection', async () => {
      renderWithProviders(<ListProperty />);

      const typeSelect = screen.getByLabelText(/property type/i);
      fireEvent.change(typeSelect, { target: { value: 'House' } });

      expect(typeSelect).toHaveValue('House');
    });
  });

  describe('Image Upload Functionality', () => {
    it('allows users to upload property images', async () => {
      renderWithProviders(<ListProperty />);

      const imageUpload = screen.getByLabelText(/upload images/i);
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      fireEvent.change(imageUpload, {
        target: { files: [testFile] }
      });

      await waitFor(() => {
        expect(screen.getByText('test.jpg')).toBeInTheDocument();
      });
    });

    it('validates image file types', async () => {
      renderWithProviders(<ListProperty />);

      const imageUpload = screen.getByLabelText(/upload images/i);
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      fireEvent.change(imageUpload, {
        target: { files: [invalidFile] }
      });

      await waitFor(() => {
        expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
      });
    });

    it('limits maximum number of images', async () => {
      renderWithProviders(<ListProperty />);

      const imageUpload = screen.getByLabelText(/upload images/i);
      const files = Array.from({ length: 25 }, (_, i) => 
        new File(['test'], `test${i}.jpg`, { type: 'image/jpeg' })
      );

      fireEvent.change(imageUpload, {
        target: { files }
      });

      await waitFor(() => {
        expect(screen.getByText(/maximum 20 images allowed/i)).toBeInTheDocument();
      });
    });

    it('allows image removal', async () => {
      renderWithProviders(<ListProperty />);

      const imageUpload = screen.getByLabelText(/upload images/i);
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      fireEvent.change(imageUpload, {
        target: { files: [testFile] }
      });

      await waitFor(() => {
        const removeButton = screen.getByRole('button', { name: /remove image/i });
        fireEvent.click(removeButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('test.jpg')).not.toBeInTheDocument();
      });
    });
  });

  describe('YouTube Video Integration', () => {
    it('accepts valid YouTube URLs', async () => {
      renderWithProviders(<ListProperty />);

      const youtubeInput = screen.getByLabelText(/youtube video url/i);
      fireEvent.change(youtubeInput, {
        target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
      });

      expect(youtubeInput).toHaveValue('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });

    it('validates YouTube URL format', async () => {
      renderWithProviders(<ListProperty />);

      const youtubeInput = screen.getByLabelText(/youtube video url/i);
      fireEvent.change(youtubeInput, {
        target: { value: 'https://invalid-url.com/video' }
      });

      fireEvent.blur(youtubeInput);

      await waitFor(() => {
        expect(screen.getByText(/invalid youtube url/i)).toBeInTheDocument();
      });
    });

    it('supports different YouTube URL formats', async () => {
      renderWithProviders(<ListProperty />);

      const youtubeInput = screen.getByLabelText(/youtube video url/i);
      
      const validUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://youtube.com/shorts/dQw4w9WgXcQ',
        'https://www.youtube.com/embed/dQw4w9WgXcQ'
      ];

      for (const url of validUrls) {
        fireEvent.change(youtubeInput, { target: { value: url } });
        expect(youtubeInput).toHaveValue(url);
      }
    });
  });

  describe('AI Description Generation', () => {
    it('generates AI description when button is clicked', async () => {
      // Mock successful AI API response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'AI-generated property description' } }]
        })
      });

      renderWithProviders(<ListProperty />);

      // Fill required fields for AI generation
      fireEvent.change(screen.getByLabelText(/property title/i), {
        target: { value: 'Modern Apartment' }
      });
      fireEvent.change(screen.getByLabelText(/location/i), {
        target: { value: 'Downtown' }
      });
      fireEvent.change(screen.getByLabelText(/monthly rent/i), {
        target: { value: '2500' }
      });

      const generateButton = screen.getByRole('button', { name: /generate ai description/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('AI-generated property description')).toBeInTheDocument();
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key'
          })
        })
      );
    });

    it('shows loading state during AI generation', async () => {
      // Mock delayed AI response
      global.fetch = jest.fn().mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({
              choices: [{ message: { content: 'Generated description' } }]
            })
          }), 100)
        )
      );

      renderWithProviders(<ListProperty />);

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/property title/i), {
        target: { value: 'Test Property' }
      });
      fireEvent.change(screen.getByLabelText(/location/i), {
        target: { value: 'Test Location' }
      });

      const generateButton = screen.getByRole('button', { name: /generate ai description/i });
      fireEvent.click(generateButton);

      expect(screen.getByText(/generating/i)).toBeInTheDocument();
      expect(generateButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.queryByText(/generating/i)).not.toBeInTheDocument();
        expect(generateButton).not.toBeDisabled();
      });
    });

    it('handles AI generation errors', async () => {
      // Mock AI API error
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          error: { message: 'API quota exceeded' }
        })
      });

      renderWithProviders(<ListProperty />);

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/property title/i), {
        target: { value: 'Test Property' }
      });

      const generateButton = screen.getByRole('button', { name: /generate ai description/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to generate ai description/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission and Success', () => {
    it('successfully submits a complete listing', async () => {
      renderWithProviders(<ListProperty />);

      // Fill all required fields
      fireEvent.change(screen.getByLabelText(/property title/i), {
        target: { value: 'Beautiful Downtown Apartment' }
      });
      fireEvent.change(screen.getByLabelText(/location/i), {
        target: { value: '123 Main St, City, State' }
      });
      fireEvent.change(screen.getByLabelText(/monthly rent/i), {
        target: { value: '2500' }
      });
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'This is a beautiful apartment in the heart of downtown with modern amenities and great location.' }
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create listing/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('listings');
      });

      // Check that insert was called with correct data
      const insertCall = (supabase.from as jest.Mock).mock.results[0].value.insert;
      expect(insertCall).toHaveBeenCalledWith({
        title: 'Beautiful Downtown Apartment',
        location: '123 Main St, City, State',
        price: 2500,
        description: 'This is a beautiful apartment in the heart of downtown with modern amenities and great location.',
        bedrooms: 1,
        bathrooms: 1,
        amenities: [],
        images: [],
        sqft: 1000,
        address: '123 Main St, City, State',
        type: 'Apartment',
        youtube_url: null,
        video_id: null,
        is_short: false,
        user_id: 'user-123'
      });
    });

    it('shows success message after successful submission', async () => {
      const { toast } = require('sonner');
      
      renderWithProviders(<ListProperty />);

      // Fill required fields and submit
      fireEvent.change(screen.getByLabelText(/property title/i), {
        target: { value: 'Test Property' }
      });
      fireEvent.change(screen.getByLabelText(/location/i), {
        target: { value: 'Test Location' }
      });
      fireEvent.change(screen.getByLabelText(/monthly rent/i), {
        target: { value: '2000' }
      });
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'This is a test property description for testing purposes.' }
      });

      const submitButton = screen.getByRole('button', { name: /create listing/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Property listed successfully!');
      });
    });

    it('handles submission errors gracefully', async () => {
      const { toast } = require('sonner');
      
      // Mock database error
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' }
        })
      });

      renderWithProviders(<ListProperty />);

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/property title/i), {
        target: { value: 'Test Property' }
      });
      fireEvent.change(screen.getByLabelText(/location/i), {
        target: { value: 'Test Location' }
      });
      fireEvent.change(screen.getByLabelText(/monthly rent/i), {
        target: { value: '2000' }
      });
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'This is a test property description for testing purposes.' }
      });

      const submitButton = screen.getByRole('button', { name: /create listing/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to create listing',
          expect.objectContaining({
            description: 'Database connection failed'
          })
        );
      });
    });

    it('shows loading state during submission', async () => {
      // Mock delayed database response
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockImplementation(() =>
          new Promise(resolve => 
            setTimeout(() => resolve({
              data: [{ id: 'listing-123' }],
              error: null
            }), 100)
          )
        )
      });

      renderWithProviders(<ListProperty />);

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/property title/i), {
        target: { value: 'Test Property' }
      });
      fireEvent.change(screen.getByLabelText(/location/i), {
        target: { value: 'Test Location' }
      });
      fireEvent.change(screen.getByLabelText(/monthly rent/i), {
        target: { value: '2000' }
      });
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'This is a test property description for testing purposes.' }
      });

      const submitButton = screen.getByRole('button', { name: /create listing/i });
      fireEvent.click(submitButton);

      // Should show loading state
      expect(screen.getByText(/submitting/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.queryByText(/submitting/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Authentication Requirements', () => {
    it('redirects unauthenticated users to login', async () => {
      // Mock no user session
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null }
      });

      renderWithProviders(<ListProperty />);

      await waitFor(() => {
        expect(screen.getByText(/sign in required/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /go to sign in/i })).toBeInTheDocument();
      });
    });

    it('allows authenticated users to access the form', async () => {
      // Mock authenticated user (already set in beforeEach)
      renderWithProviders(<ListProperty />);

      await waitFor(() => {
        expect(screen.getByLabelText(/property title/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create listing/i })).toBeInTheDocument();
      });
    });
  });
});
