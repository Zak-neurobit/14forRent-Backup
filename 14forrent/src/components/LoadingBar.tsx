import React, { useEffect, useState } from 'react';

interface LoadingBarProps {
  isLoading: boolean;
  progress?: number;
}

const LoadingBar: React.FC<LoadingBarProps> = ({ isLoading, progress: controlledProgress }) => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
      setProgress(controlledProgress || 10);
      
      if (!controlledProgress) {
        // Auto-increment progress
        const interval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) {
              clearInterval(interval);
              return 90; // Max out at 90% until actually complete
            }
            // Increment gets smaller as progress increases (like YouTube)
            const increment = Math.max(0.5, (100 - prev) * 0.05);
            return Math.min(prev + increment, 90);
          });
        }, 200);

        return () => clearInterval(interval);
      }
    } else {
      // Complete the bar
      setProgress(100);
      // Hide after animation completes
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
    }
  }, [isLoading, controlledProgress]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none"
      style={{
        background: 'rgba(0, 0, 0, 0.05)',
      }}
    >
      <div
        className="h-full transition-all duration-300 ease-out relative"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #FF6B35 0%, #FFA500 100%)',
          boxShadow: '0 0 10px rgba(255, 107, 53, 0.5), 0 0 5px rgba(255, 107, 53, 0.5)',
          transition: progress === 100 ? 'width 0.3s ease-out' : 'width 0.2s ease-out',
        }}
      >
        {/* Glowing tip effect like YouTube */}
        <div
          className="absolute right-0 top-0 h-full w-[100px]"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3))',
            filter: 'blur(3px)',
          }}
        />
      </div>
    </div>
  );
};

export default LoadingBar;