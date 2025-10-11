import { useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useWorkoutControls } from "@/contexts/WorkoutControlsContext";
import { useRestTimer } from "@/contexts/RestTimerContext";

/**
 * Integration hook that handles the connection between workout controls and rest timer
 * This prevents circular dependencies by keeping the integration at the component level
 */
export const useWorkoutTimerIntegration = () => {
  const { userId } = useAuth();
  const workoutControls = useWorkoutControls();
  const restTimer = useRestTimer();

  // Get current rest timer for this user
  const currentRestTimer = userId ? restTimer.getRestTimerForUser(userId) : undefined;
  const userSession = userId ? restTimer.getUserSession(userId) : undefined;

  // Enhanced functions that integrate both contexts
  const startWorkoutWithSession = useCallback((workoutId: string) => {
    // Start the workout timer
    workoutControls.startWorkout(workoutId);

    // Start user session in rest timer context
    if (userId) {
      restTimer.startUserWorkoutSession(
        userId,
        "Current User", // In a real app, get from user context
        workoutId
      );
    }
  }, [workoutControls, restTimer, userId]);

  const completeSetWithRest = useCallback((
    exerciseId: string,
    exerciseName: string,
    setNumber: number,
    autoStartRest: boolean = true,
    restDuration: number = 60
  ) => {
    // Complete the set
    workoutControls.completeSet(exerciseId, exerciseName, setNumber, false);

    // Start rest timer if enabled and not the last set
    if (autoStartRest && userId) {
      restTimer.startRestTimer(
        userId,
        exerciseId,
        exerciseName,
        setNumber,
        restDuration,
        true // auto-started
      );
    }
  }, [workoutControls, restTimer, userId]);

  const startRestTimer = useCallback((
    exerciseId: string,
    exerciseName: string,
    setNumber: number,
    targetDuration: number = 60
  ) => {
    if (userId) {
      return restTimer.startRestTimer(
        userId,
        exerciseId,
        exerciseName,
        setNumber,
        targetDuration,
        false // manually started
      );
    }
    return null;
  }, [restTimer, userId]);

  const stopCurrentRestTimer = useCallback(() => {
    if (currentRestTimer) {
      restTimer.stopRestTimer(currentRestTimer.id);
    }
  }, [restTimer, currentRestTimer]);

  const endWorkoutWithSession = useCallback(async () => {
    // Get current session data before ending
    if (userSession) {
      workoutControls.setTotalRestTime(userSession.totalRestTime);
    }

    // End the workout session
    if (userId) {
      restTimer.endUserWorkoutSession(userId);
    }

    // End the workout
    await workoutControls.endWorkout();
  }, [workoutControls, restTimer, userId, userSession]);

  const getEnhancedWorkoutSummary = useCallback(() => {
    const summary = workoutControls.getWorkoutSummary();

    // Include rest timer data if available
    if (userSession) {
      return {
        ...summary,
        totalRestTime: userSession.totalRestTime,
        totalActiveTime: summary.totalDuration - userSession.totalRestTime,
      };
    }

    return summary;
  }, [workoutControls, userSession]);

  return {
    // State
    currentRestTimer,
    userSession,
    isRestTimerActive: !!currentRestTimer,

    // Enhanced functions
    startWorkoutWithSession,
    completeSetWithRest,
    startRestTimer,
    stopCurrentRestTimer,
    endWorkoutWithSession,
    getEnhancedWorkoutSummary,

    // Direct access to both contexts
    workoutControls,
    restTimer,
  };
};