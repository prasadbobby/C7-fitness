import { useMemo } from "react";
import { useWorkoutControls } from "@/contexts/WorkoutControlsContext";
import { useRestTimer } from "@/contexts/RestTimerContext";
import { WorkoutSummaryData } from "@/components/Workout/WorkoutSummary";

interface UseWorkoutSummaryProps {
  workoutName: string;
  exerciseData?: {
    exerciseId: string;
    exerciseName: string;
    plannedSets: number;
    completedSets: { weight: number; reps: number; duration?: number }[];
  }[];
}

export const useWorkoutSummary = ({
  workoutName,
  exerciseData = []
}: UseWorkoutSummaryProps): WorkoutSummaryData => {
  const workoutControls = useWorkoutControls();
  const restTimer = useRestTimer();

  return useMemo(() => {
    const summary = workoutControls.getWorkoutSummary();
    const totalSets = exerciseData.reduce((sum, ex) => sum + ex.plannedSets, 0);
    const completedSets = exerciseData.reduce((sum, ex) => sum + ex.completedSets.length, 0);

    // Process exercise data
    const exercises = exerciseData.map(exercise => {
      const bestSet = exercise.completedSets.reduce((best, set) => {
        if (!best) return set;
        // Simple comparison - could be more sophisticated
        if (set.weight > best.weight || (set.weight === best.weight && set.reps > best.reps)) {
          return set;
        }
        return best;
      }, exercise.completedSets[0]);

      return {
        name: exercise.exerciseName,
        sets: exercise.plannedSets,
        completedSets: exercise.completedSets.length,
        bestSet: bestSet ? {
          weight: bestSet.weight,
          reps: bestSet.reps,
        } : undefined,
        totalRestTime: 0, // This would need to be calculated from rest timer data
      };
    });

    // Check for personal records (mock implementation)
    const personalRecords = exerciseData
      .filter(exercise => exercise.completedSets.length > 0)
      .map(exercise => {
        const bestSet = exercise.completedSets.reduce((best, set) => {
          if (!best) return set;
          if (set.weight > best.weight || (set.weight === best.weight && set.reps > best.reps)) {
            return set;
          }
          return best;
        }, exercise.completedSets[0]);

        // Mock previous best - in real app, this would come from database
        const mockPreviousBest = `${bestSet.weight - 2.5}kg × ${bestSet.reps}`;
        const newBest = `${bestSet.weight}kg × ${bestSet.reps}`;

        // Only show as PR if weight increased (simple logic)
        if (bestSet.weight > 20) { // Arbitrary threshold for demo
          return {
            exercise: exercise.exerciseName,
            previousBest: mockPreviousBest,
            newBest: newBest,
          };
        }
        return null;
      })
      .filter(Boolean) as { exercise: string; previousBest: string; newBest: string }[];

    return {
      workoutName,
      date: new Date(),
      totalDuration: summary.totalDuration,
      totalRestTime: summary.totalRestTime,
      totalActiveTime: summary.totalActiveTime,
      exercisesCompleted: exerciseData.length,
      totalSets,
      completedSets,
      exercises,
      personalRecords: personalRecords.length > 0 ? personalRecords : undefined,
    };
  }, [workoutName, exerciseData, workoutControls, restTimer]);
};

// Helper hook for generating summary from form data
export const useWorkoutSummaryFromFormData = (
  workoutName: string,
  formData: Record<string, string>,
  completedSets: Record<string, boolean>,
  exerciseMap: Record<string, { name: string; plannedSets: number }>
): WorkoutSummaryData => {
  const exerciseData = useMemo(() => {
    const exercises: { [key: string]: {
      exerciseId: string;
      exerciseName: string;
      plannedSets: number;
      completedSets: { weight: number; reps: number; duration?: number }[]
    } } = {};

    // Process form data to extract completed sets
    Object.keys(formData).forEach(key => {
      const parts = key.split('.');
      if (parts.length === 5 && parts[0] === 'exercises') {
        const exerciseId = parts[1];
        const setIndex = parseInt(parts[3]);
        const property = parts[4];

        if (completedSets[`${exerciseId}-${setIndex}`]) {
          if (!exercises[exerciseId]) {
            exercises[exerciseId] = {
              exerciseId,
              exerciseName: exerciseMap[exerciseId]?.name || 'Unknown Exercise',
              plannedSets: exerciseMap[exerciseId]?.plannedSets || 0,
              completedSets: [],
            };
          }

          // Ensure set array exists
          while (exercises[exerciseId].completedSets.length <= setIndex) {
            exercises[exerciseId].completedSets.push({ weight: 0, reps: 0 });
          }

          if (property === 'weight') {
            exercises[exerciseId].completedSets[setIndex].weight = parseFloat(formData[key]) || 0;
          } else if (property === 'reps') {
            exercises[exerciseId].completedSets[setIndex].reps = parseInt(formData[key]) || 0;
          } else if (property === 'exerciseDuration') {
            exercises[exerciseId].completedSets[setIndex].duration = parseInt(formData[key]) || 0;
          }
        }
      }
    });

    // Filter out incomplete sets and return as array
    return Object.values(exercises).map(exercise => ({
      ...exercise,
      completedSets: exercise.completedSets.filter(set => set.weight > 0 && set.reps > 0),
    }));
  }, [formData, completedSets, exerciseMap]);

  return useWorkoutSummary({ workoutName, exerciseData });
};