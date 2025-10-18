"use client";

import { useState } from "react";
import { IconPlus } from "@tabler/icons-react";
import RoutineCards from "./RoutineCards";
import RoutineFilter from "./RoutineFilter";
import { WorkoutPlan } from "@prisma/client";

type Exercise = {
  id: string;
  name: string;
  category: string;
};

type WorkoutPlanExercise = {
  Exercise: Exercise;
  order: number | null;
  sets: number;
};

type ExtendedWorkoutPlan = WorkoutPlan & {
  WorkoutPlanExercise: WorkoutPlanExercise[];
  _assignmentId?: string;
  _assignmentStatus?: string;
  _assignedBy?: string;
  _assignedByAdmin?: any;
};

type WorkoutPageClientProps = {
  assignedWorkouts: ExtendedWorkoutPlan[];
  systemRoutines: ExtendedWorkoutPlan[];
  isAdmin: boolean;
  userRole?: string;
};

export default function WorkoutPageClient({
  assignedWorkouts,
  systemRoutines,
  isAdmin,
  userRole,
}: WorkoutPageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState("");

  // Filter system routines based on selected category
  const filteredSystemRoutines = selectedCategory
    ? systemRoutines.filter(routine => routine.trainingType === selectedCategory)
    : systemRoutines;

  return (
    <>
      {assignedWorkouts.length > 0 && (
        <>
          <h2 className="font-semibold text-xl md:text-2xl mb-3">Assigned Workouts</h2>
          <RoutineCards
            routines={assignedWorkouts}
            isSystem={false}
            isAssigned={true}
            isAdmin={isAdmin}
            userRole={userRole}
          />
        </>
      )}

      {isAdmin && systemRoutines.length > 0 && (
        <>
          <h2 className="font-semibold text-xl md:text-2xl mb-3">
            Workout Library
            
          </h2>

          <RoutineFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            routineCount={filteredSystemRoutines.length}
            totalCount={systemRoutines.length}
          />

          <RoutineCards
            routines={filteredSystemRoutines}
            isSystem={true}
            isAssigned={false}
            isAdmin={isAdmin}
            userRole={userRole}
          />
        </>
      )}

      {/* Message for users with no workouts available */}
      {!isAdmin && assignedWorkouts.length === 0 && systemRoutines.length === 0 && (
        <div className="text-center py-12">
          <div className="space-y-4">
            <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
              <IconPlus className="w-8 h-8 text-zinc-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground mb-2">No Workouts Available</h3>
              <p className="text-zinc-500 text-sm max-w-md mx-auto">
                You don't have any workouts available yet. Contact your trainer or administrator to get started with your fitness journey.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}