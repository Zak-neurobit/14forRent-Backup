import { useState, useEffect, useCallback } from 'react';
import { propertyService } from '@/services/propertyService';
import { PropertyListing } from '@/data/propertyListings';
import { toast } from 'sonner';

interface UsePropertiesOptions {
  type?: 'hotDeals' | 'available' | 'search' | 'single';
  limit?: number;
  offset?: number;
  filters?: any;
  searchQuery?: string;
  propertyId?: string;
  autoLoad?: boolean;
}

interface UsePropertiesReturn {
  properties: PropertyListing[];
  loading: boolean;
  error: Error | null;
  total: number;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  isLoadingMore: boolean;
}

export const useProperties = (options: UsePropertiesOptions = {}): UsePropertiesReturn => {
  const {
    type = 'available',
    limit = 20,
    offset: initialOffset = 0,
    filters = {},
    searchQuery = '',
    propertyId = '',
    autoLoad = true
  } = options;

  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(initialOffset);

  const fetchProperties = useCallback(async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      let result: any;
      const offset = isLoadMore ? currentOffset : initialOffset;

      switch (type) {
        case 'hotDeals':
          const hotDeals = await propertyService.getHotDeals(limit);
          result = {
            data: hotDeals,
            total: hotDeals.length,
            hasMore: false
          };
          break;

        case 'search':
          if (searchQuery) {
            const searchResults = await propertyService.searchProperties(searchQuery, limit);
            result = {
              data: searchResults,
              total: searchResults.length,
              hasMore: false
            };
          } else {
            result = await propertyService.getAvailableProperties({
              limit,
              offset,
              filters
            });
          }
          break;

        case 'single':
          if (propertyId) {
            const property = await propertyService.getPropertyById(propertyId);
            result = {
              data: property ? [property] : [],
              total: property ? 1 : 0,
              hasMore: false
            };
          }
          break;

        case 'available':
        default:
          result = await propertyService.getAvailableProperties({
            limit,
            offset,
            filters
          });
          break;
      }

      if (result) {
        if (isLoadMore) {
          setProperties(prev => [...prev, ...result.data]);
          setCurrentOffset(offset + limit);
        } else {
          setProperties(result.data);
          setCurrentOffset(limit);
        }
        
        setTotal(result.total);
        setHasMore(result.hasMore);
      }
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError(err as Error);
      
      // Only show toast for user-facing errors
      if (!isLoadMore && autoLoad) {
        toast.error('Failed to load properties', {
          description: 'Please try refreshing the page'
        });
      }
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [type, limit, initialOffset, filters, searchQuery, propertyId, currentOffset, autoLoad]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    await fetchProperties(true);
  }, [hasMore, isLoadingMore, fetchProperties]);

  const refresh = useCallback(async () => {
    // Invalidate cache for this query
    if (type === 'hotDeals') {
      propertyService.invalidateCache('hotdeals');
    } else if (type === 'search' && searchQuery) {
      propertyService.invalidateCache(`search:${searchQuery}`);
    } else {
      propertyService.invalidateCache('available');
    }
    
    setCurrentOffset(initialOffset);
    await fetchProperties(false);
  }, [type, searchQuery, initialOffset, fetchProperties]);

  // Initial load
  useEffect(() => {
    if (autoLoad) {
      fetchProperties(false);
    }
  }, [type, filters, searchQuery, propertyId]); // Don't include fetchProperties to avoid infinite loops

  // Preload next page when user is near the bottom with debouncing
  useEffect(() => {
    if (hasMore && !isLoadingMore && properties.length > 0) {
      let scrollTimeout: NodeJS.Timeout;
      
      const handleScroll = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          const scrollPosition = window.innerHeight + window.scrollY;
          const threshold = document.body.offsetHeight - 1000; // 1000px before bottom
          
          if (scrollPosition > threshold) {
            loadMore();
          }
        }, 100); // Debounce for 100ms
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        clearTimeout(scrollTimeout);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [hasMore, isLoadingMore, properties.length, loadMore]);

  return {
    properties,
    loading,
    error,
    total,
    hasMore,
    loadMore,
    refresh,
    isLoadingMore
  };
};