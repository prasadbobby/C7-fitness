"use client";
import { WorkoutProvidersWrapper } from "@/contexts/WorkoutProvidersWrapper";

export function LayoutProviders({ children }: { children: React.ReactNode }) {
  return (
    <WorkoutProvidersWrapper>
      {children}
    </WorkoutProvidersWrapper>
  );
}