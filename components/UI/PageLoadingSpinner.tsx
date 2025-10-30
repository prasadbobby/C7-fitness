"use client";

import { useState, useEffect } from "react";

export default function PageLoadingSpinner() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Simple loading state management
    let loadingTimeout: NodeJS.Timeout;

    const handleStart = () => {
      setLoading(true);
      // Auto-hide after 500ms to prevent stuck loading states
      loadingTimeout = setTimeout(() => setLoading(false), 500);
    };

    const handleComplete = () => {
      setLoading(false);
      if (loadingTimeout) clearTimeout(loadingTimeout);
    };

    // Listen for navigation events on link clicks
    const handleLinkClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (link && link.href && !link.href.startsWith('#') && !link.target) {
        handleStart();
      }
    };

    // Add event listener for link clicks
    document.addEventListener('click', handleLinkClick);

    // Listen for page visibility changes to reset loading state
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleComplete();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('click', handleLinkClick);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (loadingTimeout) clearTimeout(loadingTimeout);
    };
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[10000] h-1 bg-transparent">
      <div className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary animate-pulse"></div>
      <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_1s_ease-in-out_infinite]"></div>
    </div>
  );
}