interface WorkoutPlanExerciseBase {
  exerciseId: string;
  sets: number;
  order: number;
  trackingType: "reps" | "duration";
}

interface WorkoutPlanExerciseReps extends WorkoutPlanExerciseBase {
  reps: number;
  duration?: never;
}

interface WorkoutPlanExerciseDuration extends WorkoutPlanExerciseBase {
  reps?: never;
  duration: number;
}

type WorkoutPlanExercise =
  | WorkoutPlanExerciseReps
  | WorkoutPlanExerciseDuration;

interface WorkoutPlanInput {
  name: string;
  notes: string;
  systemRoutineCategory: string;
  WorkoutPlanExercises: WorkoutPlanExercise[];
}

export const predefinedWorkouts: WorkoutPlanInput[] = [
  // Strength

  {
    name: "Full-Body Strength Builder",
    systemRoutineCategory: "Strength",
    notes:
      "This workout is designed to target all major muscle groups, providing a solid foundation of strength. Perfect for those looking to improve overall strength and endurance.",
    WorkoutPlanExercises: [
      {
        exerciseId: "b1dee2a3-e50e-4337-92f7-e9fdec515e3a", // Barbell Squat
        sets: 3,
        reps: 8,
        order: 1,
        trackingType: "reps",
      },
      {
        exerciseId: "d9247eac-57bc-46fc-9229-04f082291e2b", // Barbell Bench Press - Medium Grip
        sets: 3,
        reps: 8,
        order: 2,
        trackingType: "reps",
      },
      {
        exerciseId: "f4d47ad5-f321-4578-96d0-073aa29d4093", // Barbell Deadlift
        sets: 3,
        reps: 8,
        order: 3,
        trackingType: "reps",
      },
      {
        exerciseId: "15e1cec2-e5be-4670-81a5-5866d5ccca77", // Wide-Grip Lat Pulldown
        sets: 3,
        reps: 8,
        order: 4,
        trackingType: "reps",
      },
      {
        exerciseId: "ebaac7e5-d8f3-4064-af91-51c043ff8bfa", // Machine Shoulder (Military) Press
        sets: 3,
        reps: 8,
        order: 5,
        trackingType: "reps",
      },
      {
        exerciseId: "a5c43757-5554-4a21-afc3-8141939ddb11", // Plank
        sets: 3,
        duration: 30,
        order: 6,
        trackingType: "duration",
      },
    ],
  },
  {
    name: "Upper Body Power",
    systemRoutineCategory: "Strength",
    notes:
      "Focus on building strength in the chest, back, shoulders, and arms. Ideal for those wanting to increase upper body power and muscular definition.",
    WorkoutPlanExercises: [
      {
        exerciseId: "d9247eac-57bc-46fc-9229-04f082291e2b", // Barbell Bench Press - Medium Grip
        sets: 4,
        reps: 6,
        order: 1,
        trackingType: "reps",
      },
      {
        exerciseId: "64e84694-a8dc-480b-acbc-1e49b610cc98", // Bent Over Barbell Row
        sets: 4,
        reps: 6,
        order: 2,
        trackingType: "reps",
      },
      {
        exerciseId: "1619e2e4-9d36-4474-a606-0fef9719a1ea", // Dumbbell Shoulder Press
        sets: 3,
        reps: 8,
        order: 3,
        trackingType: "reps",
      },
      {
        exerciseId: "eb510e85-1755-4618-9d54-a6efba20edcf", // Pullups
        sets: 3,
        reps: 10,
        order: 4,
        trackingType: "reps",
      },
      {
        exerciseId: "42e5ef0b-464a-401a-b12b-dfe562ecf23a", // Dumbbell Bicep Curl
        sets: 3,
        reps: 10,
        order: 5,
        trackingType: "reps",
      },
      {
        exerciseId: "c4c3f1a9-e440-4343-a4be-a64ad3447fe1", // Dips - Triceps Version
        sets: 3,
        reps: 10,
        order: 6,
        trackingType: "reps",
      },
    ],
  },
  {
    name: "Lower Body Blast",
    systemRoutineCategory: "Strength",
    notes:
      "A comprehensive lower body workout aimed at strengthening and toning the legs and glutes. Great for building power and endurance.",
    WorkoutPlanExercises: [
      {
        exerciseId: "b1dee2a3-e50e-4337-92f7-e9fdec515e3a", // Barbell Squat
        sets: 4,
        reps: 8,
        order: 1,
        trackingType: "reps",
      },
      {
        exerciseId: "f4d47ad5-f321-4578-96d0-073aa29d4093", // Barbell Deadlift
        sets: 4,
        reps: 8,
        order: 2,
        trackingType: "reps",
      },
      {
        exerciseId: "4d17bd05-43cf-4a56-866e-edb6d20d0d84", // Dumbbell Lunges
        sets: 3,
        reps: 10,
        order: 3,
        trackingType: "reps",
      },
      {
        exerciseId: "e493579a-88cf-464e-8891-b36ba8a70527", // Leg Press
        sets: 3,
        reps: 10,
        order: 4,
        trackingType: "reps",
      },
      {
        exerciseId: "0cfc1170-9f69-4e03-9547-5b7ec270a100", // Standing Dumbbell Calf Raise
        sets: 3,
        reps: 15,
        order: 5,
        trackingType: "reps",
      },
    ],
  },
  {
    name: "Core Stability and Strength",
    systemRoutineCategory: "Strength",
    notes:
      "This routine is centered around building core muscle strength and stability, which is essential for overall fitness and injury prevention.",
    WorkoutPlanExercises: [
      {
        exerciseId: "a5c43757-5554-4a21-afc3-8141939ddb11", // Plank
        sets: 3,
        duration: 30,
        order: 1,
        trackingType: "duration",
      },
      {
        exerciseId: "c058d445-7eea-49ed-a424-131c73596098", // Standing Cable Wood Chop
        sets: 3,
        reps: 12,
        order: 2,
        trackingType: "reps",
      },
      {
        exerciseId: "c89f48b1-f6c2-4352-8ef0-8e15f419563e", // Russian Twist
        sets: 3,
        reps: 15,
        order: 3,
        trackingType: "reps",
      },
      {
        exerciseId: "9bca4cf9-f950-4835-b366-fac174402b60", // Cross-Body Crunch
        sets: 3,
        reps: 20,
        order: 4,
        trackingType: "reps",
      },
      {
        exerciseId: "2fb5b7b0-4b03-4ecc-9b30-e103c01d9c79", // Hanging Leg Raise
        sets: 3,
        reps: 10,
        order: 5,
        trackingType: "reps",
      },
    ],
  },

  // Cardio

  // Flexibility

  // Weight Loss

  // Beginner
];
