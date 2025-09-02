import React, { createContext, useContext, useState, useCallback } from 'react';

interface LoadingBarContextType {
  isLoading: boolean;
  progress: number | undefined;
  startLoading: () => void;
  finishLoading: () => void;
  setProgress: (progress: number) => void;
}

const LoadingBarContext = createContext<LoadingBarContextType | undefined>(undefined);

export const LoadingBarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgressState] = useState<number | undefined>(undefined);
  const [loadingCount, setLoadingCount] = useState(0);

  const startLoading = useCallback(() => {
    setLoadingCount(prev => {
      const newCount = prev + 1;
      if (newCount === 1) {
        // Only start loading if this is the first request
        setIsLoading(true);
        setProgressState(undefined);
      }
      return newCount;
    });
  }, []);

  const finishLoading = useCallback(() => {
    setLoadingCount(prev => {
      const newCount = Math.max(0, prev - 1);
      if (newCount === 0) {
        // Only finish loading if all requests are complete
        setIsLoading(false);
        setProgressState(undefined);
      }
      return newCount;
    });
  }, []);

  const setProgress = useCallback((progress: number) => {
    setProgressState(progress);
  }, []);

  return (
    <LoadingBarContext.Provider
      value={{
        isLoading,
        progress,
        startLoading,
        finishLoading,
        setProgress,
      }}
    >
      {children}
    </LoadingBarContext.Provider>
  );
};

export const useLoadingBar = () => {
  const context = useContext(LoadingBarContext);
  if (context === undefined) {
    throw new Error('useLoadingBar must be used within a LoadingBarProvider');
  }
  return context;
};