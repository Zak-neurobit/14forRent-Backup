
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";

// Admin emails for immediate admin access (fallback mechanism) - stored in lowercase for case-insensitive comparison
const ADMIN_EMAILS = ['zak.seid@gmail.com', 'jason@14forrent.com'];

// Track if we've already shown the sign-in alert to prevent spam
let hasShownSignInAlert = false;

// Helper function to clean up auth state
export const cleanupAuthState = () => {
  // Remove standard auth tokens
  localStorage.removeItem('supabase.auth.token');
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
};

export const signUp = async (
  email: string, 
  password: string, 
  metadata?: {
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    display_name?: string;
  }
) => {
  // Clean up any existing auth state first
  cleanupAuthState();
  
  // Try global sign out before signing up
  try {
    await supabase.auth.signOut({ scope: 'global' });
  } catch (err) {
    // Continue even if this fails
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${window.location.origin}/login?verified=true`
    }
  });
  
  if (error) throw error;

  // Notify user about email confirmation
  if (data && !data.session) {
    toast.success("Account created!", {
      description: "Please check your email to verify your account before logging in.",
      duration: 5000
    });
  }
  
  return data;
};

export const signInWithGoogle = async () => {
  // Clean up any existing auth state first
  cleanupAuthState();
  
  // Try global sign out before signing in
  try {
    await supabase.auth.signOut({ scope: 'global' });
  } catch (err) {
    // Continue even if this fails
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    }
  });
  
  if (error) throw error;
  return data;
};

export const signIn = async (email: string, password: string) => {
  // Clean up any existing auth state first
  cleanupAuthState();
  
  // Try global sign out before signing in
  try {
    await supabase.auth.signOut({ scope: 'global' });
  } catch (err) {
    // Continue even if this fails
  }

  // Handle the special case for admin with original credentials
  if (email.toLowerCase() === 'admin') {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'jason@14forrent.com', // Use admin email (lowercase) for Supabase
      password,
    });
    
    if (error) throw error;
    return data;
  }
  
  // Regular sign in (will work for all admin emails now)
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    // If the error is about email not being confirmed, provide clear message
    if (error.message.includes("Email not confirmed")) {
      if (!hasShownSignInAlert) {
        toast.error("Please verify your email", {
          description: "Check your inbox and click the verification link before logging in.",
          duration: 5000
        });
        hasShownSignInAlert = true;
      }
    } else if (error.message.includes("Invalid login credentials")) {
      if (!hasShownSignInAlert) {
        toast.error("Login failed", {
          description: "Please check your email and password and try again.",
          duration: 5000
        });
        hasShownSignInAlert = true;
      }
    }
    throw error;
  }
  return data;
};

export const signOut = async () => {
  // Reset the alert tracking
  hasShownSignInAlert = false;
  
  // Clean up auth state
  cleanupAuthState();
  
  // Perform global sign out
  try {
    await supabase.auth.signOut({ scope: 'global' });
  } catch (err) {
    console.error("Error during sign out:", err);
  }
  
  // Force page reload for a clean state
  window.location.href = '/';
};

export const isAdmin = async () => {
  const user = await getCurrentUser();
  if (!user) return false;
  
  // First check through user_roles table (primary method)
  try {
    const { data: adminRole, error } = await supabase
      .rpc('is_admin');
    
    if (!error && adminRole === true) {
      return true;
    }
  } catch (err) {
    console.error("Error checking admin role:", err);
  }
  
  // Fallback to checking email against known admin emails
  return ADMIN_EMAILS.includes(user.email?.toLowerCase() || '');
};
