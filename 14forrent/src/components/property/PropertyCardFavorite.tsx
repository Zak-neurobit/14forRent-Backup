
import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { createNotification } from "@/services/notificationService";

interface PropertyCardFavoriteProps {
  id: string;
}

// Cache for favorite status to avoid repeated queries
const FAVORITES_CACHE = new Map<string, { isFavorite: boolean; timestamp: number }>();
const FAVORITES_CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache

const PropertyCardFavorite = ({ id }: PropertyCardFavoriteProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    // Don't block on this - let it load in background
    if (!user) {
      setHasChecked(true);
      return;
    }
    
    // Check cache first with TTL
    const cacheKey = `${user.id}-${id}`;
    const cached = FAVORITES_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < FAVORITES_CACHE_TTL) {
      setIsFavorite(cached.isFavorite);
      setHasChecked(true);
      return;
    }
    
    // Mark as checked immediately to not block UI
    setHasChecked(true);
    
    // Load favorite status in background (fully non-blocking)
    const checkFavoriteStatus = async () => {
      try {
        // Check in Supabase if this property is in favorites
        const { data, error } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('listing_id', id)
          .maybeSingle();
          
        if (error) throw error;
        
        const isFav = !!data;
        setIsFavorite(isFav);
        FAVORITES_CACHE.set(cacheKey, { isFavorite: isFav, timestamp: Date.now() });
      } catch (error) {
        console.error("Error checking favorite status:", error);
      }
    };
    
    // EXTREME DEFER - This should NEVER block page load
    // Wait significantly longer to ensure zero impact on initial render
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        // Even after idle, wait more to ensure zero performance impact
        setTimeout(checkFavoriteStatus, 2000);
      }, { timeout: 10000 }); // 10 second timeout - ultra low priority
    } else {
      // Fallback for older browsers - wait much longer
      setTimeout(checkFavoriteStatus, 6000); // 6 seconds - page will definitely be loaded
    }
  }, [id, user]);
  
  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      setLoginDialogOpen(true);
      return;
    }
    
    setIsLoading(true);
    
    const cacheKey = `${user.id}-${id}`;
    
    try {
      if (isFavorite) {
        // Optimistic update
        setIsFavorite(false);
        FAVORITES_CACHE.set(cacheKey, { isFavorite: false, timestamp: Date.now() });
        
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', id);
          
        if (error) {
          // Revert on error
          setIsFavorite(true);
          FAVORITES_CACHE.set(cacheKey, { isFavorite: true, timestamp: Date.now() });
          throw error;
        }
        
        toast.success("Removed from favorites");
      } else {
        // Optimistic update
        setIsFavorite(true);
        FAVORITES_CACHE.set(cacheKey, { isFavorite: true, timestamp: Date.now() });
        
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({ 
            user_id: user.id,
            listing_id: id,
          });
          
        if (error) {
          // Revert on error
          setIsFavorite(false);
          FAVORITES_CACHE.set(cacheKey, { isFavorite: false, timestamp: Date.now() });
          throw error;
        }
        
        toast.success("Added to favorites");
        
        // Create a notification for the user (non-blocking)
        createNotification({
          user_id: user.id,
          listing_id: id,
          type: 'favorite',
          message: 'You added a property to your favorites'
        }).catch(console.error);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to update favorites");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={toggleFavorite}
        disabled={isLoading}
        className={`p-2 rounded-full backdrop-blur-sm border border-white/20 transition-all duration-200 hover:scale-105 shadow-sm ${
          isFavorite 
            ? 'bg-red-500/90 text-white' 
            : 'bg-white/80 text-red-500 hover:bg-white/90'
        } ${isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
      </button>

      <AlertDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Login Required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to be logged in to save properties to your favorites. Would you like to login or create an account now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Link to="/login">Login</Link>
            </AlertDialogAction>
            <AlertDialogAction asChild>
              <Link to="/signup">Sign Up</Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PropertyCardFavorite;
