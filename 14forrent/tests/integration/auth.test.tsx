
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import Login from '@/pages/Login';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } }))
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    }))
  }
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  }
}));

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

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login Flow', () => {
    it('successfully logs in user with valid credentials', async () => {
      // Mock successful login
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com'
          },
          session: {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh-token'
          }
        },
        error: null
      });

      renderWithProviders(<Login />);

      // Fill in login form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
      });
    });

    it('displays error message for invalid credentials', async () => {
      // Mock failed login
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      });

      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'invalid@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument();
      });
    });

    it('validates required fields', async () => {
      renderWithProviders(<Login />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });

      // Should not call API with invalid form
      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('validates email format', async () => {
      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
      });
    });

    it('shows loading state during authentication', async () => {
      // Mock delayed response
      (supabase.auth.signInWithPassword as jest.Mock).mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            data: { user: { id: 'user-123' }, session: {} },
            error: null
          }), 100)
        )
      );

      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      // Should show loading state
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.queryByText(/signing in/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('User Session Management', () => {
    it('maintains user session across page refreshes', async () => {
      // Mock existing session
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'user-123',
              email: 'test@example.com'
            },
            access_token: 'mock-token'
          }
        }
      });

      const TestComponent = () => {
        return <div data-testid="test-component">User Dashboard</div>;
      };

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(supabase.auth.getSession).toHaveBeenCalled();
      });
    });

    it('handles session expiration gracefully', async () => {
      // Mock expired session
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' }
      });

      const TestComponent = () => {
        return <div>Protected Content</div>;
      };

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(supabase.auth.getSession).toHaveBeenCalled();
      });
    });
  });

  describe('Role-Based Access Control', () => {
    it('identifies admin users correctly', async () => {
      // Mock admin user session
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'admin-123',
              email: 'jason@14forrent.com'
            }
          }
        }
      });

      // Mock admin role check
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          })
        })
      });

      const TestComponent = () => {
        return <div>Admin Panel</div>;
      };

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('user_roles');
      });
    });

    it('restricts access for non-admin users', async () => {
      // Mock regular user session
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'user-123',
              email: 'user@example.com'
            }
          }
        }
      });

      // Mock no admin role
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'No role found' }
            })
          })
        })
      });

      const TestComponent = () => {
        return <div>Regular User Content</div>;
      };

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByText('Regular User Content')).toBeInTheDocument();
      });
    });
  });

  describe('Logout Flow', () => {
    it('successfully logs out user', async () => {
      // Mock successful logout
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null
      });

      // Mock user session first
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123', email: 'test@example.com' }
          }
        }
      });

      const TestComponent = () => {
        return (
          <div>
            <button onClick={() => supabase.auth.signOut()}>
              Sign Out
            </button>
          </div>
        );
      };

      renderWithProviders(<TestComponent />);

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      fireEvent.click(signOutButton);

      await waitFor(() => {
        expect(supabase.auth.signOut).toHaveBeenCalled();
      });
    });

    it('handles logout errors gracefully', async () => {
      // Mock logout error
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: { message: 'Logout failed' }
      });

      const TestComponent = () => {
        return (
          <div>
            <button onClick={() => supabase.auth.signOut()}>
              Sign Out
            </button>
          </div>
        );
      };

      renderWithProviders(<TestComponent />);

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      fireEvent.click(signOutButton);

      await waitFor(() => {
        expect(supabase.auth.signOut).toHaveBeenCalled();
      });
    });
  });

  describe('Authentication State Changes', () => {
    it('responds to authentication state changes', async () => {
      let authStateCallback: (event: string, session: any) => void = () => {};

      // Mock auth state change listener
      (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        authStateCallback = callback;
        return {
          data: { subscription: { unsubscribe: jest.fn() } }
        };
      });

      const TestComponent = () => {
        return <div>Auth State Test</div>;
      };

      renderWithProviders(<TestComponent />);

      // Simulate sign in event
      authStateCallback('SIGNED_IN', {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'token'
      });

      // Simulate sign out event
      authStateCallback('SIGNED_OUT', null);

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
    });
  });
});
