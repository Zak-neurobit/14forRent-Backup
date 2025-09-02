
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AdminStats {
  userCount: number;
  listingCount: number;
  viewCount: number;
  showingCount: number;
  loading: boolean;
}

export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStats>({
    userCount: 0,
    listingCount: 0,
    viewCount: 0,
    showingCount: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all stats in parallel for better performance
        const [usersResult, listingResult, viewResult, showingResult] = await Promise.all([
          // Get user count from profiles table (fallback if RPC doesn't exist)
          supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true }),
          
          // Get listing count
          supabase
            .from('listings')
            .select('*', { count: 'exact', head: true }),
          
          // Get view count (including guest views)
          supabase
            .from('listing_views')
            .select('*', { count: 'exact', head: true }),
          
          // Get scheduled showings count (including guest showings)
          supabase
            .from('scheduled_showings')
            .select('*', { count: 'exact', head: true })
        ]);

        const { count: userCount, error: userError } = usersResult;
        const { count: listingCount, error: listingError } = listingResult;
        const { count: viewCount, error: viewError } = viewResult;
        const { count: showingCount, error: showingError } = showingResult;

        if (userError) {
          console.error("Error fetching users:", userError);
        }

        if (listingError || viewError || showingError) {
          console.error("Error fetching stats:", { listingError, viewError, showingError });
        }

        setStats({
          userCount: userCount || 0,
          listingCount: listingCount || 0,
          viewCount: viewCount || 0,
          showingCount: showingCount || 0,
          loading: false
        });
      } catch (error) {
        console.error("Unexpected error fetching stats:", error);
        setStats(prevStats => ({ ...prevStats, loading: false }));
      }
    };

    fetchStats();
  }, []);

  return { stats };
};
