"use client";
import clsx from "clsx";
import { useSidebarToggleContext } from "@/contexts/SidebarToggleContext";
import { WorkoutProvidersWrapper } from "@/contexts/WorkoutProvidersWrapper";
import { FloatingTimerButton } from "@/components/TimerControls/FloatingTimerButton";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapse } = useSidebarToggleContext();

  const layoutClass = clsx("flex flex-col grow p-3 md:p-5 ml-0 bg-zinc-100 dark:bg-zinc-950", {
    "md:ml-20": sidebarCollapse,
    "md:ml-64": !sidebarCollapse,
  });

  return (
    <WorkoutProvidersWrapper>
      <div className={layoutClass}>{children}</div>
      <FloatingTimerButton position="top-right" showOnlyWhenActive={true} />
    </WorkoutProvidersWrapper>
  );
}
