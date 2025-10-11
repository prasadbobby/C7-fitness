"use client";
import React, { ReactNode } from "react";
import { RestTimerProvider } from "./RestTimerContext";
import { WorkoutControlsProvider } from "./WorkoutControlsContext";

/**
 * Combined provider wrapper that ensures RestTimerContext is available
 * before WorkoutControlsContext, since WorkoutControls depends on RestTimer
 */
export const WorkoutProvidersWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <RestTimerProvider>
      <WorkoutControlsProvider>
        {children}
      </WorkoutControlsProvider>
    </RestTimerProvider>
  );
};

// Re-export hooks for convenience
export { useRestTimer } from "./RestTimerContext";
export { useWorkoutControls } from "./WorkoutControlsContext";