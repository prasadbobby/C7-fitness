"use client";
import { useSidebarToggleContext } from "@/contexts/SidebarToggleContext";
import clsx from "clsx";

export default function ResponsiveLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapse } = useSidebarToggleContext();

  const wrapperClass = clsx({
    "transition-all duration-300 ease-in-out": true,
    // Mobile: No margin (sidebar overlays) - margin handled by LayoutWrapper for desktop
  });

  return <div className={wrapperClass}>{children}</div>;
}