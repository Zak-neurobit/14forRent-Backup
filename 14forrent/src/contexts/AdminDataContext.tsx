import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminStats {
  totalListings: number;
  totalShowings: number;
  pendingShowings: number;
  totalUsers: number;
  activeUsers: number;
  lastUpdated: number;
}

interface AdminDataContextType {
  stats: AdminStats;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  updateStat: (key: keyof AdminStats, value: number) => void;
  isRefreshing: boolean;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

// Shared cache configuration
const CACHE_KEY = 'admin_shared_data';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const STALE_WHILE_REVALIDATE_TTL = 15 * 60 * 1000; // 15 minutes for stale-while-revalidate

export const AdminDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<AdminStats>({
    totalListings: 0,
    totalShowings: 0,
    pendingShowings: 0,
    totalUsers: 0,
    activeUsers: 0,
    lastUpdated: Date.now()
  });
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load from cache on mount with better stale-while-revalidate strategy
  useEffect(() => {
    const loadCachedData = () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          
          if (age < CACHE_TTL) {
            // Fresh data - use it without refreshing
            console.log('AdminDataContext: Using fresh cached data');
            setStats(data);
            return 'fresh';
          } else if (age < STALE_WHILE_REVALIDATE_TTL) {
            // Stale but usable - show cached data and refresh in background
            console.log('AdminDataContext: Using stale cached data, refreshing in background');
            setStats(data);
            refreshStats(true);
            return 'stale';
          }
        }
      } catch (err) {
        console.error('Error loading cached admin data:', err);
      }
      return false;
    };

    const cacheStatus = loadCachedData();
    if (!cacheStatus) {
      refreshStats();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const refreshStats = useCallback(async (isBackgroundRefresh = false) => {
    // Prevent duplicate concurrent calls
    if (refreshPromiseRef.current) {
      console.log('AdminDataContext: Refresh already in progress, waiting for completion');
      return refreshPromiseRef.current;
    }

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    if (!isBackgroundRefresh) {
      setLoading(true);
      setError(null);
    } else {
      setIsRefreshing(true);
    }

    const refreshPromise = (async () => {
      try {
        // Fetch all stats in parallel for maximum speed with abort signal
        const [
          listingResult,
          showingResult,
          pendingResult,
          userResult,
          activeUserResult
        ] = await Promise.allSettled([
          supabase.from('listings').select('*', { count: 'exact', head: true }).abortSignal(abortController.signal),
          supabase.from('scheduled_showings').select('*', { count: 'exact', head: true }).abortSignal(abortController.signal),
          supabase.from('scheduled_showings').select('*', { count: 'exact', head: true }).eq('status', 'pending').abortSignal(abortController.signal),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).abortSignal(abortController.signal),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true).abortSignal(abortController.signal)
        ]);

      const newStats: AdminStats = {
        totalListings: listingResult.status === 'fulfilled' ? (listingResult.value.count || 0) : stats.totalListings,
        totalShowings: showingResult.status === 'fulfilled' ? (showingResult.value.count || 0) : stats.totalShowings,
        pendingShowings: pendingResult.status === 'fulfilled' ? (pendingResult.value.count || 0) : stats.pendingShowings,
        totalUsers: userResult.status === 'fulfilled' ? (userResult.value.count || 0) : stats.totalUsers,
        activeUsers: activeUserResult.status === 'fulfilled' ? (activeUserResult.value.count || 0) : stats.activeUsers,
        lastUpdated: Date.now()
      };

      setStats(newStats);

      // Cache the data
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: newStats,
        timestamp: Date.now()
      }));

        console.log('AdminDataContext: Stats refreshed', newStats);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('AdminDataContext: Request was aborted');
          return;
        }
        console.error('Error refreshing admin stats:', err);
        if (!isBackgroundRefresh) {
          setError('Failed to refresh statistics');
        }
      } finally {
        if (!isBackgroundRefresh) {
          setLoading(false);
        } else {
          setIsRefreshing(false);
        }
        // Clean up references
        refreshPromiseRef.current = null;
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      }
    })();

    refreshPromiseRef.current = refreshPromise;
    return refreshPromise;
  }, [stats]);

  const updateStat = useCallback((key: keyof AdminStats, value: number) => {
    setStats(prev => {
      const newStats = { ...prev, [key]: value, lastUpdated: Date.now() };
      
      // Update cache
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: newStats,
        timestamp: Date.now()
      }));
      
      return newStats;
    });
  }, []);

  return (
    <AdminDataContext.Provider value={{ stats, loading, error, refreshStats, updateStat, isRefreshing }}>
      {children}
    </AdminDataContext.Provider>
  );
};

export const useAdminData = () => {
  const context = useContext(AdminDataContext);
  if (context === undefined) {
    throw new Error('useAdminData must be used within an AdminDataProvider');
  }
  return context;
};