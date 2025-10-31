"use client";

import React, { useEffect, useRef, useState, ReactNode } from "react";
import { FlameIcon, type FlameIconHandle } from "./FlameIcon";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  pullDistance?: number;
  triggerDistance?: number;
  disabled?: boolean;
}

export default function PullToRefresh({
  children,
  onRefresh,
  pullDistance = 80,
  triggerDistance = 60,
  disabled = false,
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const flameRef = useRef<FlameIconHandle>(null);

  // Check if we can pull (at top of page)
  const checkCanPull = () => {
    if (disabled) return false;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return scrollTop === 0;
  };

  // Handle touch start
  const handleTouchStart = (e: TouchEvent) => {
    if (!checkCanPull()) return;

    startY.current = e.touches[0].clientY;
    setCanPull(true);
  };

  // Handle touch move
  const handleTouchMove = (e: TouchEvent) => {
    if (!canPull || disabled) return;

    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;

    if (deltaY > 0) {
      // Prevent default browser refresh
      e.preventDefault();

      // Calculate pull distance with resistance
      const resistance = 0.5;
      const calculatedPullDistance = Math.min(deltaY * resistance, pullDistance);

      setPullY(calculatedPullDistance);
      setIsPulling(calculatedPullDistance > 10);
    }
  };

  // Handle touch end
  const handleTouchEnd = () => {
    if (!canPull || disabled) {
      setCanPull(false);
      return;
    }

    const shouldRefresh = pullY >= triggerDistance;

    if (shouldRefresh && !isRefreshing) {
      setIsRefreshing(true);

      // Execute refresh function
      const refreshResult = onRefresh();

      if (refreshResult && typeof refreshResult.then === 'function') {
        // Handle async refresh
        refreshResult.finally(() => {
          setTimeout(() => {
            setIsRefreshing(false);
            setPullY(0);
            setIsPulling(false);
            setCanPull(false);
          }, 500);
        });
      } else {
        // Handle sync refresh
        setTimeout(() => {
          setIsRefreshing(false);
          setPullY(0);
          setIsPulling(false);
          setCanPull(false);
        }, 1000);
      }
    } else {
      // Reset without refreshing
      setPullY(0);
      setIsPulling(false);
      setCanPull(false);
    }
  };

  // Add event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [canPull, pullY, isRefreshing, disabled]);

  // Trigger flame animation based on pull state
  useEffect(() => {
    if (flameRef.current) {
      if (pullY >= triggerDistance || isRefreshing) {
        flameRef.current.startAnimation();
      } else if (pullY === 0) {
        flameRef.current.stopAnimation();
      }
    }
  }, [pullY, triggerDistance, isRefreshing]);

  // Calculate animation values
  const progress = Math.min(pullY / triggerDistance, 1);
  const opacity = Math.min(pullY / triggerDistance, 1);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {/* Clean Pull-to-Refresh Indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center z-50 transition-all duration-300 ease-out"
        style={{
          transform: `translateY(${pullY - 50}px)`,
          opacity: isPulling || isRefreshing ? opacity : 0,
          pointerEvents: 'none',
        }}
      >
        {/* Animated Flame Icon Container */}
        <div className="flex flex-col items-center gap-2">
          <div
            className={`
              flex items-center justify-center w-10 h-10 rounded-full
              transition-all duration-300 ease-out
              ${isRefreshing
                ? 'bg-primary/20 text-primary'
                : pullY >= triggerDistance
                  ? 'bg-primary/20 text-primary'
                  : 'bg-content2 text-foreground-500'
              }
            `}
            style={{
              transform: `scale(${0.8 + progress * 0.4}) ${isRefreshing ? 'rotate(360deg)' : `rotate(${progress >= 1 ? 0 : progress * -180}deg)`}`,
            }}
          >
            <FlameIcon
              ref={flameRef}
              size={20}
              className={`transition-all duration-300 ${isRefreshing ? 'animate-pulse' : ''}`}
            />
          </div>

          {/* Enhanced Visible Text */}
          {pullY > 10 && (
            <div
              className="transition-all duration-300"
              style={{
                opacity: Math.min(pullY / 25, 1),
                transform: `translateY(${pullY * 0.05}px)`,
              }}
            >
              <div className="text-xs font-semibold text-foreground-700">
                {isRefreshing
                  ? 'Refreshing...'
                  : pullY >= triggerDistance
                    ? 'Release to refresh'
                    : 'Pull to refresh'
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content with strong blur effect when pulling */}
      <div
        className="w-full transition-all duration-300 ease-out"
        style={{
          transform: `translateY(${isPulling || isRefreshing ? pullY * 0.15 : 0}px)`,
          filter: isPulling || isRefreshing
            ? `blur(${progress * 4}px) brightness(${0.9 - progress * 0.2})`
            : 'blur(0px) brightness(1)',
        }}
      >
        {children}
      </div>

      {/* Enhanced overlay for better contrast */}
      {(isPulling || isRefreshing) && (
        <div
          className="absolute inset-0 z-40 pointer-events-none transition-all duration-300"
          style={{
            background: `rgba(0, 0, 0, ${opacity * 0.15})`,
          }}
        />
      )}
    </div>
  );
}