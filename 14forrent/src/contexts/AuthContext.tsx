
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

// Get admin emails from environment variables
const getAdminEmails = (): string[] => {
  const adminEmailsEnv = import.meta.env.VITE_ADMIN_EMAILS;
  if (!adminEmailsEnv) {
    console.warn('VITE_ADMIN_EMAILS environment variable not set');
    return [];
  }
  // Convert all emails to lowercase for case-insensitive comparison
  return adminEmailsEnv.split(',').map((email: string) => email.trim().toLowerCase());
};

const ADMIN_EMAILS = getAdminEmails();

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAdmin: false,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const [hasShownSignOut, setHasShownSignOut] = useState(false);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        // EXTREME DEFER - Admin check should never impact page load
        // Set admin false initially, update later if needed
        if (currentUser) {
          // Check admin status immediately for better performance
          const userEmail = currentUser?.email?.toLowerCase();
          const isAdminUser = userEmail ? ADMIN_EMAILS.includes(userEmail) : false;
          setIsAdmin(isAdminUser);
        } else {
          setIsAdmin(false);
        }
        
        if (event === 'SIGNED_OUT') {
          if (!hasShownSignOut) {
            toast({
              title: "Signed out",
              description: "You have been successfully signed out",
            });
            setHasShownSignOut(true);
            // Reset welcome flag when signing out
            setHasShownWelcome(false);
          }
        } else if (event === 'SIGNED_IN' && currentUser) {
          if (!hasShownWelcome) {
            toast({
              title: "Welcome back!",
              description: `Signed in as ${currentUser.email}`,
            });
            setHasShownWelcome(true);
            // Reset sign out flag when signing in
            setHasShownSignOut(false);
          }
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsLoading(false); // Set loading false immediately for fast render
      
      // Check admin status immediately for better performance
      if (currentUser) {
        const userEmail = currentUser?.email?.toLowerCase();
        const isAdminUser = userEmail ? ADMIN_EMAILS.includes(userEmail) : false;
        setIsAdmin(isAdminUser);
      }
      
      // If there's already a session, mark welcome as shown to avoid duplicate toast
      if (currentUser) {
        setHasShownWelcome(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [hasShownWelcome, hasShownSignOut]);

  const signOut = async () => {
    await supabase.auth.signOut();
    // Reset flags after sign out
    setHasShownWelcome(false);
    setHasShownSignOut(false);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
