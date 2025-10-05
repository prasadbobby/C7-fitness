"use client";

import { useState } from "react";
import { Button } from "@nextui-org/button";
import Link from "next/link";
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
};

type YourRoutinesSectionProps = {
  userRoutines: ExtendedWorkoutPlan[];
  isAdmin: boolean;
};

export default function YourRoutinesSection({
  userRoutines,
  isAdmin,
}: YourRoutinesSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState("");

  // Filter routines based on selected category
  const filteredRoutines = selectedCategory
    ? userRoutines.filter(routine => routine.trainingType === selectedCategory)
    : userRoutines;

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 mt-10">
        <h2 className="font-semibold text-xl md:text-2xl mb-3 md:mb-0">Your Routines</h2>
        <Button
          as={Link}
          href="/edit-routine/step-1"
          color="primary"
          className="gap-unit-1"
          size="sm"
        >
          <IconPlus size={16} /> New Routine
        </Button>
      </div>

      {userRoutines.length > 0 ? (
        <>
          <RoutineFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            routineCount={filteredRoutines.length}
            totalCount={userRoutines.length}
          />
          <RoutineCards routines={filteredRoutines} isSystem={false} />
        </>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg">
          <div className="space-y-2">
            <IconPlus className="w-8 h-8 text-zinc-400 mx-auto" />
            <p className="text-zinc-500 text-sm">
              You haven't created any custom routines yet.
            </p>
            <Button
              as={Link}
              href="/edit-routine/step-1"
              color="primary"
              size="sm"
              className="mt-2"
            >
              Create Your First Routine
            </Button>
          </div>
        </div>
      )}
    </>
  );
}