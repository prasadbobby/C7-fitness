"use client";
import { useState, useRef, useEffect } from "react";
import RoutineCard from "./RoutineCard";
import { useWorkoutControls } from "@/contexts/WorkoutControlsContext";
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

type RoutineCardsProps = {
  routines: ExtendedWorkoutPlan[];
  isSystem: boolean;
  isAssigned?: boolean;
  isAdmin?: boolean;
  userRole?: string;
};

export default function RoutineCards({
  routines,
  isSystem,
  isAssigned = false,
  isAdmin = false,
  userRole,
}: RoutineCardsProps) {
  const { activeWorkoutRoutine } = useWorkoutControls();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && dropdownRefs.current[openDropdown]) {
        if (!dropdownRefs.current[openDropdown]?.contains(event.target as Node)) {
          setOpenDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const toggleDropdown = (routineId: string) => {
    setOpenDropdown(openDropdown === routineId ? null : routineId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 mb-3 overflow-visible">
      {routines.map((routine) => (
        <RoutineCard
          key={routine.id}
          routine={routine}
          isSystem={isSystem}
          isAssigned={isAssigned}
          activeWorkoutRoutine={activeWorkoutRoutine}
          isAdmin={isAdmin}
          userRole={userRole}
          openDropdown={openDropdown}
          toggleDropdown={toggleDropdown}
          dropdownRef={(el: HTMLDivElement | null) => dropdownRefs.current[routine.id] = el}
        />
      ))}
    </div>
  );
}
