"use client";
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
  ReactNode,
  useCallback,
} from "react";
import { toast } from "sonner";

// Types for rest timer management
interface RestTimer {
  id: string;
  userId: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  startTime: number;
  duration: number; // Current duration in seconds
  targetDuration: number; // Target rest duration
  isActive: boolean;
  isPaused: boolean;
  autoStarted: boolean; // Whether this timer was auto-started
}

interface UserWorkoutSession {
  userId: string;
  userName: string;
  workoutSessionId: string;
  status: 'ACTIVE' | 'PAUSED' | 'RESTING' | 'COMPLETED';
  currentExercise?: string;
  currentSet: number;
  totalSets: number;
  restTimer?: RestTimer;
  workoutStartTime: number;
  totalWorkoutDuration: number;
  totalRestTime: number;
  lastActivity: number;
}

interface RestTimerContextType {
  // Rest timer state
  activeRestTimers: Map<string, RestTimer>;
  userSessions: Map<string, UserWorkoutSession>;

  // Rest timer functions
  startRestTimer: (
    userId: string,
    exerciseId: string,
    exerciseName: string,
    setNumber: number,
    targetDuration?: number,
    autoStart?: boolean
  ) => string;

  stopRestTimer: (timerId: string) => void;
  pauseRestTimer: (timerId: string) => void;
  resumeRestTimer: (timerId: string) => void;
  skipRestTimer: (timerId: string) => void;
  extendRestTimer: (timerId: string, additionalSeconds: number) => void;

  // User session management
  startUserWorkoutSession: (userId: string, userName: string, workoutSessionId: string) => void;
  updateUserSession: (userId: string, updates: Partial<UserWorkoutSession>) => void;
  endUserWorkoutSession: (userId: string) => void;

  // Multi-user gym management
  isGymMasterMode: boolean;
  setGymMasterMode: (enabled: boolean) => void;
  currentGymSessionId: string | null;
  setCurrentGymSessionId: (sessionId: string | null) => void;

  // Utility functions
  formatTime: (seconds: number) => string;
  getRestTimerForUser: (userId: string) => RestTimer | undefined;
  getUserSession: (userId: string) => UserWorkoutSession | undefined;
  getAllActiveSessions: () => UserWorkoutSession[];

  // Audio/notification settings
  enableAudio: boolean;
  setEnableAudio: (enabled: boolean) => void;
  playRestCompleteSound: () => void;
  playWarningSound: () => void;
}

const RestTimerContext = createContext<RestTimerContextType | undefined>(undefined);

export const RestTimerProvider = ({ children }: { children: ReactNode }) => {
  // Core state
  const [activeRestTimers, setActiveRestTimers] = useState<Map<string, RestTimer>>(new Map());
  const [userSessions, setUserSessions] = useState<Map<string, UserWorkoutSession>>(new Map());
  const [isGymMasterMode, setGymMasterMode] = useState(false);
  const [currentGymSessionId, setCurrentGymSessionId] = useState<string | null>(null);
  const [enableAudio, setEnableAudio] = useState(true);

  // Refs for interval management
  const intervalRefs = useRef<Map<string, number>>(new Map());
  const audioRefs = useRef<{ complete: HTMLAudioElement; warning: HTMLAudioElement } | null>(null);

  // Initialize audio - disabled for now to prevent file loading errors
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Audio files disabled to prevent 404 errors
      // audioRefs.current = {
      //   complete: new Audio('/sounds/rest-complete.mp3'),
      //   warning: new Audio('/sounds/rest-warning.mp3'),
      // };
    }
  }, []);

  // Define utility functions before they are used in useEffect
  const playRestCompleteSound = useCallback(() => {
    if (enableAudio && audioRefs.current?.complete) {
      audioRefs.current.complete.play().catch(console.warn);
    } else if (enableAudio) {
      // Fallback - just log for now
      console.log("🔔 Rest timer complete!");
    }
  }, [enableAudio]);

  const playWarningSound = useCallback(() => {
    if (enableAudio && audioRefs.current?.warning) {
      audioRefs.current.warning.play().catch(console.warn);
    } else if (enableAudio) {
      // Fallback - just log for now
      console.log("⚠️ Rest timer warning!");
    }
  }, [enableAudio]);

  const vibrateDevice = useCallback((pattern: number | number[] = 200) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.warn('Vibration not supported or failed:', error);
      }
    }
  }, []);

  // Timer update effect
  useEffect(() => {
    const updateTimers = () => {
      const now = Date.now();
      const updatedTimers = new Map(activeRestTimers);
      let hasChanges = false;

      updatedTimers.forEach((timer) => {
        if (timer.isActive && !timer.isPaused) {
          const elapsedSeconds = Math.floor((now - timer.startTime) / 1000);
          const updatedTimer = { ...timer, duration: elapsedSeconds };

          // Check for completion - use >= to ensure we don't miss completion due to interval throttling
          if (elapsedSeconds >= timer.targetDuration) {
            updatedTimer.isActive = false;

            // IMPORTANT: Ensure we use the exact target duration for accurate rest time calculation
            // This prevents issues with interval throttling in production
            const exactRestTime = timer.targetDuration;

            // Play completion sound
            if (enableAudio) {
              playRestCompleteSound();
            }
            // Vibrate device - strong pattern for completion
            vibrateDevice([300, 100, 300, 100, 300]);
            // Show notification
            toast.success(`Rest timer completed for ${timer.exerciseName}!`, {
              duration: 5000,
            });

            console.log('🔍 Rest timer auto-completion detected:', {
              timerId: timer.id,
              userId: timer.userId,
              exerciseName: timer.exerciseName,
              elapsedSeconds,
              targetDuration: timer.targetDuration,
              exactRestTime,
              timerStartTime: timer.startTime,
              now
            });

            // CRITICAL FIX: Update user session with rest time when timer completes automatically
            setUserSessions(prev => {
              const session = prev.get(timer.userId);
              if (session && session.restTimer?.id === timer.id) {
                const updated = new Map(prev);
                console.log('🔍 Rest timer auto-completion - accumulating rest time:', {
                  timerId: timer.id,
                  userId: timer.userId,
                  exerciseName: timer.exerciseName,
                  exactRestTime,
                  previousTotalRestTime: session.totalRestTime,
                  newTotalRestTime: session.totalRestTime + exactRestTime
                });
                updated.set(timer.userId, {
                  ...session,
                  restTimer: undefined,
                  status: 'ACTIVE',
                  totalRestTime: session.totalRestTime + exactRestTime,
                  lastActivity: now,
                });
                return updated;
              } else {
                console.log('🔍 Rest timer auto-completion - session not found or timer mismatch:', {
                  sessionExists: !!session,
                  sessionRestTimerId: session?.restTimer?.id,
                  expectedTimerId: timer.id
                });
              }
              return prev;
            });
          } else if (elapsedSeconds >= timer.targetDuration - 10 && elapsedSeconds < timer.targetDuration) {
            // Warning at 10 seconds remaining
            if (enableAudio && elapsedSeconds === timer.targetDuration - 10) {
              playWarningSound();
              // Vibrate device - gentle pattern for warning
              vibrateDevice([100, 50, 100]);
            }
          }

          updatedTimers.set(timer.id, updatedTimer);
          hasChanges = true;
        }
      });

      if (hasChanges) {
        setActiveRestTimers(updatedTimers);
      }

      // Update user sessions with current timer data
      const updatedSessions = new Map(userSessions);
      let sessionChanges = false;

      updatedSessions.forEach((session, userId) => {
        if (session.restTimer) {
          const timer = updatedTimers.get(session.restTimer.id);
          if (timer) {
            const updatedSession = {
              ...session,
              restTimer: timer,
              status: timer.isActive ? 'RESTING' as const : 'ACTIVE' as const,
              lastActivity: now,
            };
            updatedSessions.set(userId, updatedSession);
            sessionChanges = true;
          }
        }
      });

      if (sessionChanges) {
        setUserSessions(updatedSessions);
      }
    };

    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [activeRestTimers, userSessions, enableAudio, vibrateDevice, playRestCompleteSound, playWarningSound]);

  // Rest timer functions
  const startRestTimer = useCallback((
    userId: string,
    exerciseId: string,
    exerciseName: string,
    setNumber: number,
    targetDuration: number = 60,
    autoStart: boolean = false
  ): string => {
    const timerId = `${userId}-${exerciseId}-${setNumber}-${Date.now()}`;
    const timer: RestTimer = {
      id: timerId,
      userId,
      exerciseId,
      exerciseName,
      setNumber,
      startTime: Date.now(),
      duration: 0,
      targetDuration,
      isActive: true,
      isPaused: false,
      autoStarted: autoStart,
    };

    // Stop any existing rest timer for this user
    const existingTimer = getRestTimerForUser(userId);
    if (existingTimer) {
      stopRestTimer(existingTimer.id);
    }

    setActiveRestTimers(prev => new Map(prev.set(timerId, timer)));

    // Update user session
    setUserSessions(prev => {
      const session = prev.get(userId);
      if (session) {
        const updated = new Map(prev);
        updated.set(userId, {
          ...session,
          restTimer: timer,
          status: 'RESTING',
          currentSet: setNumber,
          lastActivity: Date.now(),
        });
        return updated;
      }
      return prev;
    });

    if (!autoStart) {
      toast.info(`Rest timer started: ${exerciseName} - Set ${setNumber}`, {
        duration: 3000,
      });
    }

    return timerId;
  }, []);

  const stopRestTimer = useCallback((timerId: string) => {
    const timer = activeRestTimers.get(timerId);
    if (!timer) return;

    setActiveRestTimers(prev => {
      const updated = new Map(prev);
      updated.delete(timerId);
      return updated;
    });

    // Clear interval if exists
    const intervalId = intervalRefs.current.get(timerId);
    if (intervalId) {
      clearInterval(intervalId);
      intervalRefs.current.delete(timerId);
    }

    // Update user session
    setUserSessions(prev => {
      const session = prev.get(timer.userId);
      if (session && session.restTimer?.id === timerId) {
        const updated = new Map(prev);
        // Add rest time to total
        const restTime = Math.floor((Date.now() - timer.startTime) / 1000);
        console.log('🔍 Rest timer manual stop - accumulating rest time:', {
          timerId,
          userId: timer.userId,
          exerciseName: timer.exerciseName,
          restTime,
          previousTotalRestTime: session.totalRestTime,
          newTotalRestTime: session.totalRestTime + restTime
        });
        updated.set(timer.userId, {
          ...session,
          restTimer: undefined,
          status: 'ACTIVE',
          totalRestTime: session.totalRestTime + restTime,
          lastActivity: Date.now(),
        });
        return updated;
      }
      return prev;
    });

    toast.success(`Rest timer stopped: ${timer.exerciseName}`);
  }, [activeRestTimers]);

  const pauseRestTimer = useCallback((timerId: string) => {
    setActiveRestTimers(prev => {
      const timer = prev.get(timerId);
      if (timer && timer.isActive) {
        const updated = new Map(prev);
        updated.set(timerId, { ...timer, isPaused: true });
        return updated;
      }
      return prev;
    });
  }, []);

  const resumeRestTimer = useCallback((timerId: string) => {
    setActiveRestTimers(prev => {
      const timer = prev.get(timerId);
      if (timer && timer.isPaused) {
        const updated = new Map(prev);
        // Adjust start time to account for pause duration
        const pauseDuration = Date.now() - timer.startTime - (timer.duration * 1000);
        updated.set(timerId, {
          ...timer,
          isPaused: false,
          startTime: timer.startTime + pauseDuration,
        });
        return updated;
      }
      return prev;
    });
  }, []);

  const skipRestTimer = useCallback((timerId: string) => {
    const timer = activeRestTimers.get(timerId);
    if (timer) {
      toast.info(`Rest skipped: ${timer.exerciseName}`);
      stopRestTimer(timerId);
    }
  }, [activeRestTimers, stopRestTimer]);

  const extendRestTimer = useCallback((timerId: string, additionalSeconds: number) => {
    setActiveRestTimers(prev => {
      const timer = prev.get(timerId);
      if (timer) {
        const updated = new Map(prev);
        updated.set(timerId, {
          ...timer,
          targetDuration: timer.targetDuration + additionalSeconds,
        });
        toast.info(`Rest timer extended by ${additionalSeconds}s: ${timer.exerciseName}`);
        return updated;
      }
      return prev;
    });
  }, []);

  // User session management
  const startUserWorkoutSession = useCallback((
    userId: string,
    userName: string,
    workoutSessionId: string
  ) => {
    const session: UserWorkoutSession = {
      userId,
      userName,
      workoutSessionId,
      status: 'ACTIVE',
      currentSet: 0,
      totalSets: 0,
      workoutStartTime: Date.now(),
      totalWorkoutDuration: 0,
      totalRestTime: 0,
      lastActivity: Date.now(),
    };

    setUserSessions(prev => new Map(prev.set(userId, session)));
    toast.success(`Workout session started for ${userName}`);
  }, []);

  const updateUserSession = useCallback((userId: string, updates: Partial<UserWorkoutSession>) => {
    setUserSessions(prev => {
      const session = prev.get(userId);
      if (session) {
        const updated = new Map(prev);
        updated.set(userId, { ...session, ...updates, lastActivity: Date.now() });
        return updated;
      }
      return prev;
    });
  }, []);

  const endUserWorkoutSession = useCallback((userId: string) => {
    const session = userSessions.get(userId);
    if (session) {
      // Stop any active rest timer
      if (session.restTimer) {
        stopRestTimer(session.restTimer.id);
      }

      // Calculate final duration
      const totalDuration = Math.floor((Date.now() - session.workoutStartTime) / 1000);

      setUserSessions(prev => {
        const updated = new Map(prev);
        updated.delete(userId);
        return updated;
      });

      toast.success(`Workout completed for ${session.userName} - Duration: ${formatTime(totalDuration)}, Rest: ${formatTime(session.totalRestTime)}`);
    }
  }, [userSessions, stopRestTimer]);

  // Utility functions
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds - hours * 3600) / 60);
    const remainingSeconds = seconds - hours * 3600 - minutes * 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }, []);

  const getRestTimerForUser = useCallback((userId: string): RestTimer | undefined => {
    for (const timer of Array.from(activeRestTimers.values())) {
      if (timer.userId === userId && timer.isActive) {
        return timer;
      }
    }
    return undefined;
  }, [activeRestTimers]);

  const getUserSession = useCallback((userId: string): UserWorkoutSession | undefined => {
    return userSessions.get(userId);
  }, [userSessions]);

  const getAllActiveSessions = useCallback((): UserWorkoutSession[] => {
    return Array.from(userSessions.values());
  }, [userSessions]);

  return (
    <RestTimerContext.Provider
      value={{
        // State
        activeRestTimers,
        userSessions,

        // Rest timer functions
        startRestTimer,
        stopRestTimer,
        pauseRestTimer,
        resumeRestTimer,
        skipRestTimer,
        extendRestTimer,

        // User session management
        startUserWorkoutSession,
        updateUserSession,
        endUserWorkoutSession,

        // Multi-user gym management
        isGymMasterMode,
        setGymMasterMode,
        currentGymSessionId,
        setCurrentGymSessionId,

        // Utility functions
        formatTime,
        getRestTimerForUser,
        getUserSession,
        getAllActiveSessions,

        // Audio/notification settings
        enableAudio,
        setEnableAudio,
        playRestCompleteSound,
        playWarningSound,
      }}
    >
      {children}
    </RestTimerContext.Provider>
  );
};

export const useRestTimer = () => {
  const context = useContext(RestTimerContext);
  if (context === undefined) {
    throw new Error("useRestTimer must be used within a RestTimerProvider");
  }
  return context;
};