"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useConfetti } from "@/contexts/ConfettiContext";
import { TrackingType } from "@prisma/client";

import { Card, CardBody, CardFooter, CardHeader } from "@nextui-org/card";
import { Button, ButtonGroup } from "@nextui-org/button";
import { IconPlus, IconX } from "@tabler/icons-react";

import { useWorkoutControls } from "@/contexts/WorkoutControlsContext";
import { useWorkoutData } from "@/contexts/WorkoutDataContext";
import { useAuth } from "@clerk/nextjs";
import { useRestTimer } from "@/contexts/RestTimerContext";

import ExerciseTable from "./ExerciseTable";
import StatusBar from "./StatusBar";
import { handleSaveWorkout, handleSaveAdminWorkout } from "@/server-actions/WorkoutServerActions";
import ExerciseOrderIndicator from "@/components/Generic/ExerciseOrderIndicator";

interface Exercise {
  id: string;
  name: string;
}

interface WorkoutPlanExercise {
  Exercise: Exercise;
  sets: number;
  reps: number | null;
  exerciseDuration: number | null;
  trackingType: string;
  order: number | null;
}

interface Workout {
  id: string;
  name: string;
  notes: string | null;
  WorkoutPlanExercise: WorkoutPlanExercise[];
}

export default function WorkoutManager({
  workout,
  assignmentId,
  isAdminMode = false,
  targetUserId,
  targetUserDbId
}: {
  workout: Workout;
  assignmentId?: string;
  isAdminMode?: boolean;
  targetUserId?: string;
  targetUserDbId?: string;
}) {
  const router = useRouter();
  const workoutPlanId = workout.id;
  const { userId } = useAuth();
  const restTimer = useRestTimer();

  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [activeRestTimer, setActiveRestTimer] = useState<{
    exerciseIndex: number;
    setIndex: number;
    timeRemaining: number;
    isActive: boolean;
  } | null>(null);

  // Function to update assignment status
  const updateAssignmentStatus = async (status: string) => {
    if (!assignmentId) return;

    console.log(`🔍 Updating assignment status: ${status} (Admin mode: ${isAdminMode}, Assignment ID: ${assignmentId})`);

    try {
      let response;
      if (isAdminMode) {
        // Use admin API for assignment updates in admin mode
        response = await fetch(`/api/admin/assignments/${assignmentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
      } else {
        // Use user API for regular mode
        response = await fetch("/api/user/assigned-workouts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignmentId, status }),
        });
      }

      if (response.ok) {
        console.log(`✅ Assignment status updated successfully to: ${status}`);
      } else {
        console.error(`❌ Failed to update assignment status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error updating assignment status:", error);
    }
  };

  const { startConfetti } = useConfetti();
  const { workoutExercises, setWorkoutExercises } = useWorkoutData();
  const {
    setIsSaving,
    workoutDuration,
    setWorkoutDuration,
    workoutStartTime,
    setWorkoutStartTime,
    activeWorkoutRoutine,
    setActiveWorkoutRoutine,
    startWorkout,
  } = useWorkoutControls();

  // Populate our empty context state with the exercise data.
  useEffect(() => {
    if (!isDataLoaded && !activeWorkoutRoutine && workout) {
      const initialWorkoutExercises = workout.WorkoutPlanExercise.map(
        (exerciseDetail) => ({
          exerciseId: exerciseDetail.Exercise.id,
          exerciseName: exerciseDetail.Exercise.name,
          sets: Array.from({ length: exerciseDetail.sets }, () => ({
            completed: false,
            reps: exerciseDetail.reps || null,
            duration: exerciseDetail.exerciseDuration || null,
            weight: null,
          })),
          trackingType: exerciseDetail.trackingType,
        }),
      );
      setWorkoutExercises(initialWorkoutExercises);
      setIsDataLoaded(true);

      // Initialize rest timer session when workout loads
      if (userId) {
        restTimer.startUserWorkoutSession(
          userId,
          "Current User",
          workoutPlanId
        );
      }
    }
  }, [workout, activeWorkoutRoutine, setWorkoutExercises, isDataLoaded, userId, restTimer, workoutPlanId]);

  // Update local rest timer state when context rest timer changes
  useEffect(() => {
    if (!userId) return;

    const currentRestTimer = restTimer.getRestTimerForUser(userId);
    if (currentRestTimer && workoutExercises) {
      // Find the exercise and set index for this timer
      const exerciseIndex = workoutExercises.findIndex(
        exercise => exercise.exerciseId === currentRestTimer.exerciseId
      );

      if (exerciseIndex !== -1) {
        const setIndex = currentRestTimer.setNumber - 1;
        const timeRemaining = Math.max(0, currentRestTimer.targetDuration - currentRestTimer.duration);

        setActiveRestTimer({
          exerciseIndex,
          setIndex,
          timeRemaining,
          isActive: currentRestTimer.isActive,
        });
      }
    } else {
      setActiveRestTimer(null);
    }
  }, [restTimer, userId, workoutExercises]);

  // Handle clicking complete set button
  const handleCompleteSet = (
    exerciseIndex: number,
    setIndex: number,
    exerciseName: string,
    isSelected: boolean,
  ) => {
    if (!workoutExercises) {
      toast.error("Workout exercises data is not loaded yet");
      return;
    }

    const exerciseDetail = workoutExercises[exerciseIndex];
    const set = exerciseDetail.sets[setIndex];

    if (
      set.weight === null ||
      !Number(set.weight) ||
      (exerciseDetail.trackingType === "reps" &&
        (set.reps === null || !Number(set.reps))) ||
      (exerciseDetail.trackingType === "duration" &&
        (set.duration === null || !Number(set.duration)))
    ) {
      toast.error(
        "Please fill in all fields before marking the set as completed",
      );
      return;
    }

    if (!workoutStartTime) {
      startWorkout(workoutPlanId);
      updateAssignmentStatus("IN_PROGRESS");
    }
    setWorkoutExercises((prevWorkoutExercises) => {
      if (!prevWorkoutExercises) return prevWorkoutExercises;
      const updatedWorkoutExercises = [...prevWorkoutExercises];
      const exerciseToUpdate = { ...updatedWorkoutExercises[exerciseIndex] };
      const setToUpdate = { ...exerciseToUpdate.sets[setIndex] };
      setToUpdate.completed = isSelected;
      exerciseToUpdate.sets[setIndex] = setToUpdate;
      updatedWorkoutExercises[exerciseIndex] = exerciseToUpdate;

      if (setToUpdate.completed) {
        toast.success(`${exerciseName} Set ${setIndex + 1} completed`);
        // Note: Rest timer now manually controlled - no automatic start
      } else {
        toast(`${exerciseName} Set ${setIndex + 1} marked as incomplete`);

        // Stop any active rest timer if unchecking
        const currentRestTimer = userId ? restTimer.getRestTimerForUser(userId) : undefined;
        if (currentRestTimer && currentRestTimer.exerciseId === exerciseToUpdate.exerciseId && currentRestTimer.setNumber === setIndex + 1) {
          restTimer.stopRestTimer(currentRestTimer.id);
        }
      }
      return updatedWorkoutExercises;
    });
  };

  const handleWeightChange = (
    exerciseIndex: number,
    setIndex: number,
    newValue: number,
  ) => {
    setWorkoutExercises((prevWorkoutExercises) => {
      if (!prevWorkoutExercises) return prevWorkoutExercises;

      const updatedWorkoutExercises = [...prevWorkoutExercises];
      const exerciseToUpdate = { ...updatedWorkoutExercises[exerciseIndex] };
      const setToUpdate = { ...exerciseToUpdate.sets[setIndex] };
      setToUpdate.weight = newValue;
      exerciseToUpdate.sets[setIndex] = setToUpdate;
      updatedWorkoutExercises[exerciseIndex] = exerciseToUpdate;
      return updatedWorkoutExercises;
    });
  };

  // Handle changing reps for a set
  const handleRepChange = (
    exerciseIndex: number,
    setIndex: number,
    newValue: number | null,
  ) => {
    setWorkoutExercises((prevWorkoutExercises) => {
      if (!prevWorkoutExercises) return prevWorkoutExercises;

      const updatedWorkoutExercises = [...prevWorkoutExercises];
      const exerciseToUpdate = { ...updatedWorkoutExercises[exerciseIndex] };
      const setToUpdate = { ...exerciseToUpdate.sets[setIndex] };
      setToUpdate.reps = newValue;
      exerciseToUpdate.sets[setIndex] = setToUpdate;
      updatedWorkoutExercises[exerciseIndex] = exerciseToUpdate;
      return updatedWorkoutExercises;
    });
  };

  //Handle changing exerciseDuration for a set
  const handleDurationChange = (
    exerciseIndex: number,
    setIndex: number,
    newValue: number | null,
  ) => {
    setWorkoutExercises((prevWorkoutExercises) => {
      if (!prevWorkoutExercises) return prevWorkoutExercises;

      const updatedWorkoutExercises = [...prevWorkoutExercises];
      const exerciseToUpdate = { ...updatedWorkoutExercises[exerciseIndex] };
      const setToUpdate = { ...exerciseToUpdate.sets[setIndex] };
      setToUpdate.duration = newValue;
      exerciseToUpdate.sets[setIndex] = setToUpdate;
      updatedWorkoutExercises[exerciseIndex] = exerciseToUpdate;
      return updatedWorkoutExercises;
    });
  };

  // Add Sets to exercise
  const addSet = (exerciseIndex: number, exerciseName: string) => {
    setWorkoutExercises((prevWorkoutExercises) => {
      if (!prevWorkoutExercises) return prevWorkoutExercises;
      const updatedWorkoutExercises = [...prevWorkoutExercises];
      const exerciseToUpdate = { ...updatedWorkoutExercises[exerciseIndex] };
      const newSet = {
        completed: false,
        reps: workout.WorkoutPlanExercise[exerciseIndex].reps || null,
        duration:
          workout.WorkoutPlanExercise[exerciseIndex].exerciseDuration || null,
        weight: null,
      };
      exerciseToUpdate.sets = [...exerciseToUpdate.sets, newSet];
      updatedWorkoutExercises[exerciseIndex] = exerciseToUpdate;
      toast.success(`Set added to ${exerciseName}`);
      return updatedWorkoutExercises;
    });
  };

  //Remove Sets from exercise
  const removeSet = (exerciseIndex: number, exerciseName: string) => {
    setWorkoutExercises((prevWorkoutExercises) => {
      if (!prevWorkoutExercises) return prevWorkoutExercises;
      const updatedWorkoutExercises = [...prevWorkoutExercises];
      if (updatedWorkoutExercises[exerciseIndex].sets.length > 1) {
        if (
          window.confirm(
            `Are you sure you want to delete the last set from ${exerciseName}?`,
          )
        ) {
          const exerciseToUpdate = {
            ...updatedWorkoutExercises[exerciseIndex],
          };
          exerciseToUpdate.sets.pop();
          updatedWorkoutExercises[exerciseIndex] = exerciseToUpdate;
          toast.success(`Set removed from ${exerciseName}`);
          return updatedWorkoutExercises;
        }
      } else {
        toast.error(
          `Cannot remove. At least one set is required for ${exerciseName}.`,
        );
      }
      return prevWorkoutExercises;
    });
  };

  // Manual rest timer handlers
  const handleStartRestTimer = (
    exerciseIndex: number,
    setIndex: number,
    exerciseName: string,
    duration: number,
  ) => {
    if (!userId) {
      toast.error("User not authenticated");
      return;
    }

    const exerciseId = workoutExercises?.[exerciseIndex]?.exerciseId;
    if (!exerciseId) {
      toast.error("Exercise ID not found");
      return;
    }

    // Start rest timer with custom duration
    const timerId = restTimer.startRestTimer(
      userId,
      exerciseId,
      exerciseName,
      setIndex + 1,
      duration, // custom duration from user selection
      false // not auto-started
    );

    // Set up local state for countdown display
    setActiveRestTimer({
      exerciseIndex,
      setIndex,
      timeRemaining: duration,
      isActive: true,
    });

    const formatDuration = (seconds: number) => {
      if (seconds < 60) return `${seconds}s`;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    };

    toast.success(`Rest timer started: ${exerciseName} - Set ${setIndex + 1} (${formatDuration(duration)})`);
  };

  const handleStopRestTimer = (exerciseIndex: number, setIndex: number) => {
    if (!userId) return;

    const currentRestTimer = restTimer.getRestTimerForUser(userId);
    if (currentRestTimer &&
        currentRestTimer.exerciseId === workoutExercises?.[exerciseIndex]?.exerciseId &&
        currentRestTimer.setNumber === setIndex + 1) {
      restTimer.stopRestTimer(currentRestTimer.id);
    }

    setActiveRestTimer(null);
  };

  // Cancel workout and reset states
  const cancelWorkout = () => {
    if (
      window.confirm(
        "Are you sure you want to cancel the workout? No data will be saved.",
      )
    ) {
      // End rest timer session
      if (userId) {
        restTimer.endUserWorkoutSession(userId);
      }

      setWorkoutExercises([]);
      setWorkoutDuration(0);
      setWorkoutStartTime(null);
      setActiveWorkoutRoutine(null);
      toast("Workout cancelled");
      router.push("/workout");
    }
  };

  const completeWorkout = async () => {
    if (workoutExercises) {
      const hasIncompleteSets = workoutExercises.some((exercise) =>
        exercise.sets.some((set) => !set.completed),
      );

      if (hasIncompleteSets) {
        const proceedWithIncompleteSets = window.confirm(
          "There are incomplete sets. These will not be saved. Do you want to proceed?",
        );
        if (!proceedWithIncompleteSets) {
          return;
        }
      }

      const filteredExercises = workoutExercises
        .filter((exercise) => exercise.sets.some((set) => set.completed))
        .map((exercise) => ({
          ...exercise,
          sets: exercise.sets.filter((set) => set.completed),
        }));

      if (filteredExercises.length === 0) {
        toast.error(
          "You need to complete at least one set to save the workout.",
        );
        return;
      }

      try {
        setIsSaving(true);

        // Get timing data from rest timer context
        const userSession = userId ? restTimer.getUserSession(userId) : null;
        const totalRestTime = userSession?.totalRestTime || 0;
        const totalActiveTime = workoutDuration - totalRestTime;

        console.log('🔍 Workout completion timing data:', {
          workoutDuration,
          totalRestTime,
          totalActiveTime,
          userSession: userSession ? {
            userId: userSession.userId,
            totalRestTime: userSession.totalRestTime,
            status: userSession.status
          } : 'No session found'
        });

        const exercisesData = filteredExercises.map((exercise) => ({
          exerciseId: exercise.exerciseId,
          trackingType:
            TrackingType[exercise.trackingType as keyof typeof TrackingType],
          sets: exercise.sets.map((set) => ({
            reps: set.reps,
            weight: set.weight,
            duration: set.duration,
            completed: set.completed,
          })),
        }));

        const data = {
          name: workout.name,
          date: new Date().toISOString(),
          duration: workoutDuration,
          totalRestTime: totalRestTime,
          totalActiveTime: totalActiveTime,
          workoutPlanId: workout.id,
          exercises: exercisesData,
        };

        let response;

        if (isAdminMode && targetUserId) {
          // Admin mode: save workout for the target user
          const adminData = {
            ...data,
            targetUserId: targetUserId
          };
          response = await handleSaveAdminWorkout(adminData);
        } else {
          // Regular mode: save workout for current user
          response = await handleSaveWorkout(data);
        }

        if (response.success) {
          startConfetti();
          await updateAssignmentStatus("COMPLETED");

          // End rest timer session
          if (userId) {
            restTimer.endUserWorkoutSession(userId);
          }

          // Different redirect based on mode
          if (isAdminMode && targetUserDbId) {
            router.push(`/admin/users/${targetUserDbId}/progress`);
            toast.success("Workout saved for user successfully!");
          } else if (isAdminMode) {
            // Fallback if targetUserDbId is not provided
            router.push(`/admin/users/${targetUserId}/progress`);
            toast.success("Workout saved for user successfully!");
          } else {
            router.push("/dashboard");
            toast.success(`Workout completed! Rest time: ${restTimer.formatTime(totalRestTime)}, Active time: ${restTimer.formatTime(totalActiveTime)}`);
          }

          setWorkoutExercises([]);
          setWorkoutDuration(0);
          setWorkoutStartTime(null);
          setActiveWorkoutRoutine(null);
        } else {
          toast.error("Failed to save workout");
        }
      } catch (error) {
        toast.error("An error occurred while saving the workout");
      } finally {
        setIsSaving(false);
      }
    } else {
      toast.error("No workout exercises available.");
    }
  };

  const workoutName = workout.name;

  // Completion Percentage Calculator
  const totalSets = workoutExercises
    ? workoutExercises.reduce((acc, curr) => acc + curr.sets.length, 0)
    : 0;

  const completedSets = workoutExercises
    ? workoutExercises.reduce(
        (acc, curr) => acc + curr.sets.filter((set) => set.completed).length,
        0,
      )
    : 0;

  const progressPercentage =
    totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  return (
    <div className="pb-32">
      {workout.notes && (
        <p className="mb-3 text-sm text-zinc-500">{workout.notes}</p>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3">
        {workoutExercises?.map((exercise, index) => (
          <Card shadow="none" className="shadow-md" key={exercise.exerciseId}>
            <CardHeader className="text-lg px-5">
              <div className="flex gap-2 items-center mb-3">
                <ExerciseOrderIndicator position={index} />
                <p className="text-lg">{exercise.exerciseName}</p>
              </div>
            </CardHeader>
            <CardBody className="pb-1 pt-0">
              <ExerciseTable
                exerciseDetail={exercise}
                index={index}
                handleCompleteSet={handleCompleteSet}
                handleWeightChange={handleWeightChange}
                handleRepChange={handleRepChange}
                handleDurationChange={handleDurationChange}
                handleStartRestTimer={handleStartRestTimer}
                handleStopRestTimer={handleStopRestTimer}
                activeRestTimer={activeRestTimer}
              />
            </CardBody>
            <CardFooter className="gap-2 px-5 bg-default-100">
              <ButtonGroup className="shrink-0">
                <Button
                  size="sm"
                  onPress={() => addSet(index, exercise.exerciseName)}
                >
                  <IconPlus size={16} />
                  Add Set
                </Button>
                <Button
                  size="sm"
                  onPress={() => removeSet(index, exercise.exerciseName)}
                >
                  <IconX size={16} />
                  Remove Set
                </Button>
              </ButtonGroup>
            </CardFooter>
          </Card>
        ))}
      </div>
      <StatusBar
        completeWorkout={completeWorkout}
        progressPercentage={progressPercentage}
        activeRoutineId={workoutPlanId}
        cancelWorkout={cancelWorkout}
      />
    </div>
  );
}
