"use client";
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { toast } from "sonner";
// Import moved to inside component to prevent circular dependency

interface WorkoutControlsContextType {
  // Existing workout controls
  isPaused: boolean;
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
  isSaving: boolean;
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  workoutDuration: number;
  setWorkoutDuration: React.Dispatch<React.SetStateAction<number>>;
  workoutStartTime: number | null;
  setWorkoutStartTime: React.Dispatch<React.SetStateAction<number | null>>;
  activeWorkoutRoutine: string | null;
  setActiveWorkoutRoutine: React.Dispatch<React.SetStateAction<string | null>>;
  formatDuration: (seconds: number) => string;
  togglePause: () => void;
  startWorkout: (workoutId: string) => void;

  // Enhanced functionality for rest timers
  currentUserId: string | null;
  setCurrentUserId: React.Dispatch<React.SetStateAction<string | null>>;
  totalRestTime: number;
  setTotalRestTime: React.Dispatch<React.SetStateAction<number>>;
  isRestTimerActive: boolean;

  // Set completion and rest timer integration
  completeSet: (exerciseId: string, exerciseName: string, setNumber: number, autoStartRest?: boolean) => void;
  startRestForCurrentSet: (exerciseId: string, exerciseName: string, setNumber: number, targetDuration?: number) => void;
  stopCurrentRestTimer: () => void;

  // Enhanced workout management
  endWorkout: () => Promise<void>;
  getWorkoutSummary: () => {
    totalDuration: number;
    totalRestTime: number;
    totalActiveTime: number;
  };
}

const WorkoutControlsContext = createContext<
  WorkoutControlsContextType | undefined
>(undefined);

export const WorkoutControlsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  // Existing state
  const [isPaused, setIsPaused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const [activeWorkoutRoutine, setActiveWorkoutRoutine] = useState<
    string | null
  >(null);

  // New state for enhanced functionality
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [totalRestTime, setTotalRestTime] = useState(0);

  const intervalRef = useRef<number | null>(null);

  // Note: RestTimer integration will be handled at component level to avoid circular dependency

  useEffect(() => {
    const handleWorkoutTimer = () => {
      if (workoutStartTime && !isPaused) {
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor(
          (currentTime - workoutStartTime) / 1000,
        );
        setWorkoutDuration(elapsedSeconds);
      }
    };

    if (workoutStartTime && !isPaused) {
      intervalRef.current = window.setInterval(handleWorkoutTimer, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [workoutStartTime, isPaused]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds - hours * 3600) / 60);
    const remainingSeconds = seconds - hours * 3600 - minutes * 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  const togglePause = () => {
    if (!workoutStartTime) {
      toast.success("Workout Session Started from pause!");
    } else {
      setIsPaused((prevIsPaused) => !prevIsPaused);
      toast.success(isPaused ? "Workout Resumed!" : "Workout Paused!");
    }
  };

  const startWorkout = (workoutId: string) => {
    if (!workoutStartTime) {
      setWorkoutStartTime(Date.now());
      setActiveWorkoutRoutine(workoutId);
      setTotalRestTime(0); // Reset rest time for new workout

      // Start user workout session will be handled by components that use both contexts

      toast.success("Workout Session Started!");
    }
  };

  // New enhanced functions - simplified to avoid circular dependency
  const completeSet = (
    exerciseId: string,
    exerciseName: string,
    setNumber: number,
    autoStartRest: boolean = true
  ) => {
    // Rest timer logic will be handled by components that use both contexts
    toast.success(`Set ${setNumber} completed for ${exerciseName}!`);
  };

  const startRestForCurrentSet = (
    exerciseId: string,
    exerciseName: string,
    setNumber: number,
    targetDuration: number = 60
  ) => {
    // Rest timer logic will be handled by components
    console.log(`Starting rest for ${exerciseName}, set ${setNumber}, duration ${targetDuration}s`);
  };

  const stopCurrentRestTimer = () => {
    // Rest timer logic will be handled by components
    console.log("Stopping current rest timer");
  };

  const endWorkout = async () => {
    // Clear workout state
    setWorkoutStartTime(null);
    setActiveWorkoutRoutine(null);
    setIsPaused(false);

    toast.success("Workout session ended!");
  };

  const getWorkoutSummary = () => {
    const totalDuration = workoutDuration;
    const activeTime = totalDuration - totalRestTime;

    return {
      totalDuration,
      totalRestTime,
      totalActiveTime: Math.max(0, activeTime),
    };
  };

  // Computed values - simplified
  const isRestTimerActive = false; // Will be computed at component level

  return (
    <WorkoutControlsContext.Provider
      value={{
        // Existing states
        isPaused,
        setIsPaused,
        isSaving,
        setIsSaving,
        workoutDuration,
        setWorkoutDuration,
        workoutStartTime,
        setWorkoutStartTime,
        activeWorkoutRoutine,
        setActiveWorkoutRoutine,

        // New states
        currentUserId,
        setCurrentUserId,
        totalRestTime,
        setTotalRestTime,
        isRestTimerActive,

        // Existing functions
        formatDuration,
        togglePause,
        startWorkout,

        // New functions
        completeSet,
        startRestForCurrentSet,
        stopCurrentRestTimer,
        endWorkout,
        getWorkoutSummary,
      }}
    >
      {children}
    </WorkoutControlsContext.Provider>
  );
};

export const useWorkoutControls = () => {
  const context = useContext(WorkoutControlsContext);
  if (context === undefined) {
    throw new Error(
      "useWorkoutControls must be used within a WorkoutControlsProvider",
    );
  }
  return context;
};
