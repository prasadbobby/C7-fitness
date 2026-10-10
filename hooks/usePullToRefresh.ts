"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

interface UsePullToRefreshOptions {
  onRefresh?: () => Promise<void> | void;
  refreshType?: 'router' | 'window' | 'custom';
  disabled?: boolean;
}
export default function usePullToRefresh({
  onRefresh,
  refreshType = 'router',
  disabled = false,
}: UsePullToRefreshOptions = {}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const handleRefresh = useCallback(async () => {
    if (disabled || isRefreshing) return;

    setIsRefreshing(true);

    try {
      if (onRefresh) {
        // Custom refresh function
        await onRefresh();
      } else {
        // Default refresh behavior
        switch (refreshType) {
          case 'router':
            router.refresh();
            // Add small delay for visual feedback
            await new Promise(resolve => setTimeout(resolve, 800));
            break;
          case 'window':
            window.location.reload();
            break;
          case 'custom':
            // Do nothing, let the custom onRefresh handle it
            break;
        }
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, refreshType, disabled, isRefreshing, router]);

  return {
    handleRefresh,
    isRefreshing,
  };
}