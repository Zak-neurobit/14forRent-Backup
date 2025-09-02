import React from 'react';
import LoadingBar from './LoadingBar';
import RouteChangeListener from './RouteChangeListener';
import { useLoadingBar } from '@/contexts/LoadingBarContext';

const AppWithLoadingBar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading, progress } = useLoadingBar();

  return (
    <>
      <LoadingBar isLoading={isLoading} progress={progress} />
      <RouteChangeListener />
      {children}
    </>
  );
};

export default AppWithLoadingBar;