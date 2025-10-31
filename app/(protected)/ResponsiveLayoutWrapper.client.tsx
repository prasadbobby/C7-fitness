"use client";
// import { useSidebarToggleContext } from "@/contexts/SidebarToggleContext";
import PullToRefresh from "@/components/UI/PullToRefresh";
import usePullToRefresh from "@/hooks/usePullToRefresh";
import clsx from "clsx";

export default function ResponsiveLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // const { sidebarCollapse } = useSidebarToggleContext();
  const { handleRefresh, isRefreshing } = usePullToRefresh({
    refreshType: 'router',
  });

  const wrapperClass = clsx({
    "transition-all duration-300 ease-in-out": true,
    // Mobile: No margin (sidebar overlays) - margin handled by LayoutWrapper for desktop
  });

  return (
    <div className={wrapperClass}>
      <PullToRefresh
        onRefresh={handleRefresh}
        pullDistance={100}
        triggerDistance={70}
        disabled={isRefreshing}
      >
        {children}
      </PullToRefresh>
    </div>
  );
}