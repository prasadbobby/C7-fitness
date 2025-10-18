"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Chip } from "@nextui-org/chip";
import { Divider } from "@nextui-org/divider";
import { Spinner } from "@nextui-org/spinner";
import BottomSheet from "@/components/UI/BottomSheet";
import { IconBarbell, IconClock, IconRepeat } from "@tabler/icons-react";

type Exercise = {
  id: string;
  name: string;
  category: string;
};

type WorkoutPlanExercise = {
  Exercise: Exercise;
  order: number | null;
  sets: number;
  reps?: number | null;
  exerciseDuration?: number | null;
  trackingType: string;
};

type WorkoutPlan = {
  id: string;
  name: string;
  notes?: string | null;
  trainingType?: string | null;
  createdAt: string;
  updatedAt: string;
  WorkoutPlanExercise: WorkoutPlanExercise[];
};

type WorkoutPreviewProps = {
  isOpen: boolean;
  onClose: () => void;
  workoutId: string | null;
};

const trainingTypeColorMap: Record<string, any> = {
  ENDURANCE: "secondary",
  HYPERTROPHY: "success",
  STRENGTH: "danger",
  POWER: "warning",
  TONING: "primary",
  FUNCTIONAL: "default",
};

const trainingTypeDisplayMap: Record<string, string> = {
  ENDURANCE: "Endurance",
  HYPERTROPHY: "Hypertrophy",
  STRENGTH: "Strength",
  POWER: "Power",
  TONING: "Toning",
  FUNCTIONAL: "Functional",
};

const categoryColorMap: Record<string, any> = {
  strength: "success",
  cardio: "secondary",
  stretching: "warning",
  plyometrics: "primary",
  strongman: "danger",
  powerlifting: "default",
  olympic_weightlifting: "secondary",
};

export default function WorkoutPreview({ isOpen, onClose, workoutId }: WorkoutPreviewProps) {
  const [workout, setWorkout] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && workoutId) {
      fetchWorkoutDetails();
    } else {
      setWorkout(null);
      setError(null);
    }
  }, [isOpen, workoutId]);

  const fetchWorkoutDetails = async () => {
    if (!workoutId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/workouts/${workoutId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch workout details');
      }
      const data = await response.json();
      setWorkout(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workout');
    } finally {
      setLoading(false);
    }
  };

  const getTotalEstimatedTime = () => {
    if (!workout) return 0;

    let totalTime = 0;
    workout.WorkoutPlanExercise.forEach(exercise => {
      if (exercise.trackingType === 'duration' && exercise.exerciseDuration) {
        totalTime += exercise.exerciseDuration * exercise.sets;
      } else if (exercise.trackingType === 'reps') {
        // Estimate ~30 seconds per set for reps-based exercises
        totalTime += 30 * exercise.sets;
      }
    });

    // Add estimated rest time (assume 60 seconds between sets)
    const totalSets = workout.WorkoutPlanExercise.reduce((sum, ex) => sum + ex.sets, 0);
    totalTime += (totalSets - 1) * 60; // Rest between sets

    return Math.round(totalTime / 60); // Convert to minutes
  };

  const renderExerciseDetails = (exercise: WorkoutPlanExercise) => {
    if (exercise.trackingType === 'duration') {
      return (
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <IconClock size={14} />
          <span>{exercise.exerciseDuration}s</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <IconRepeat size={14} />
          <span>{exercise.reps} reps</span>
        </div>
      );
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Workout Preview"
      size="lg"
    >
      {loading && (
        <div className="flex justify-center items-center py-8">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}

      {workout && !loading && (
        <div className="space-y-6">
          {/* Workout Header */}
          <div>
            <h2 className="text-xl font-semibold mb-2">{workout.name}</h2>

            <div className="flex flex-wrap gap-2 mb-3">
              {workout.trainingType && (
                <Chip
                  size="sm"
                  variant="flat"
                  color={trainingTypeColorMap[workout.trainingType] || "default"}
                >
                  {trainingTypeDisplayMap[workout.trainingType] || workout.trainingType}
                </Chip>
              )}

              <Chip size="sm" variant="flat" color="default">
                {workout.WorkoutPlanExercise.length} exercises
              </Chip>

              <Chip size="sm" variant="flat" color="default">
                ~{getTotalEstimatedTime()} minutes
              </Chip>
            </div>

            {workout.notes && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {workout.notes}
              </p>
            )}
          </div>

          <Divider />

          {/* Exercise List */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <IconBarbell size={18} />
              Exercises
            </h3>

            <div className="space-y-3">
              {workout.WorkoutPlanExercise
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((exercise, index) => (
                  <Card key={exercise.Exercise.id} shadow="none" className="border">
                    <CardBody className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded">
                              {index + 1}
                            </span>
                            <h4 className="font-medium">{exercise.Exercise.name}</h4>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                              <IconRepeat size={14} />
                              <span>{exercise.sets} sets</span>
                            </div>

                            {renderExerciseDetails(exercise)}
                          </div>
                        </div>

                        <Chip
                          size="sm"
                          variant="flat"
                          color={categoryColorMap[exercise.Exercise.category] || "default"}
                          className="capitalize"
                        >
                          {exercise.Exercise.category}
                        </Chip>
                      </div>
                    </CardBody>
                  </Card>
                ))}
            </div>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}