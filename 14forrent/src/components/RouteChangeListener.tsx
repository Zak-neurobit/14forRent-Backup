import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLoadingBar } from '@/contexts/LoadingBarContext';

const RouteChangeListener = () => {
  const location = useLocation();
  const { startLoading, finishLoading } = useLoadingBar();

  useEffect(() => {
    // Start loading when route changes
    startLoading();
    
    // Finish loading after a short delay to allow components to mount
    const timer = setTimeout(() => {
      finishLoading();
    }, 500);

    return () => {
      clearTimeout(timer);
      // Ensure loading is finished if component unmounts early
      finishLoading();
    };
  }, [location.pathname]);

  return null;
};

export default RouteChangeListener;