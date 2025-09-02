import { useEffect } from 'react';
import { useLoadingBar } from '@/contexts/LoadingBarContext';

/**
 * Hook to show loading bar during data fetching
 * @param isLoading - Boolean indicating if data is being fetched
 */
export const useLoadingBarOnFetch = (isLoading: boolean) => {
  const { startLoading, finishLoading } = useLoadingBar();

  useEffect(() => {
    if (isLoading) {
      startLoading();
    } else {
      finishLoading();
    }

    // Cleanup: ensure loading is finished when component unmounts
    return () => {
      if (isLoading) {
        finishLoading();
      }
    };
  }, [isLoading, startLoading, finishLoading]);
};