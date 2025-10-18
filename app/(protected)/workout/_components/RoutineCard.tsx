"use client";
import React from "react";
import { format } from "date-fns";
import { Card } from "@nextui-org/card";
import { Chip } from "@nextui-org/chip";
import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";
import Link from "next/link";
import {
  IconPlayerPlayFilled,
  IconBarbell,
  IconClock,
  IconUser,
  IconCalendar,
  IconDots,
  IconEye,
  IconEdit,
  IconTrash
} from "@tabler/icons-react";
import { WorkoutPlan } from "@prisma/client";
import { useState } from "react";
import { useDisclosure } from "@nextui-org/react";
import { handleDeleteRoutine } from "@/server-actions/RoutineServerActions";
import { toast } from "sonner";
import BottomSheet from "@/components/UI/BottomSheet";
import CustomButton from "@/components/UI/CustomButton";
import WorkoutPreview from "./WorkoutPreview";
import { useRouter } from "next/navigation";

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

type RoutineCardProps = {
  routine: ExtendedWorkoutPlan & {
    _assignmentId?: string;
    _assignmentStatus?: string;
    _assignedBy?: string;
    _assignedByAdmin?: {
      userId: string;
      firstName: string | null;
      lastName: string | null;
      username: string | null;
      email: string | null;
    };
  };
  isSystem: boolean;
  isAssigned?: boolean;
  activeWorkoutRoutine: string | null;
  isAdmin?: boolean;
  userRole?: string;
  openDropdown?: string | null;
  toggleDropdown?: (routineId: string) => void;
  dropdownRef?: (el: HTMLDivElement | null) => void;
};

type Color =
  | "default"
  | "success"
  | "secondary"
  | "warning"
  | "primary"
  | "danger";

const categoryColorMap: Record<string, Color> = {
  strength: "success",
  cardio: "secondary",
  stretching: "warning",
  plyometrics: "primary",
  strongman: "danger",
  powerlifting: "default",
  olympic_weightlifting: "secondary",
};

const trainingTypeColorMap: Record<string, Color> = {
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

export default function RoutineCard({
  routine,
  isSystem,
  isAssigned = false,
  activeWorkoutRoutine,
  isAdmin = false,
  userRole,
  openDropdown,
  toggleDropdown,
  dropdownRef,
}: RoutineCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();

  const isAnotherWorkoutInProgress =
    activeWorkoutRoutine !== null && activeWorkoutRoutine !== routine.id;
  const isCurrentWorkout = activeWorkoutRoutine === routine.id;
  const uniqueCategories = new Set();

  // Determine what actions to show based on user role
  const isAdminUser = userRole === "ADMIN";
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  // Super admins can edit/delete all workouts (both system and personal)
  // Admins can only preview
  const canEdit = isSuperAdmin;
  const canDelete = isSuperAdmin;

  routine.WorkoutPlanExercise.forEach((exerciseDetail) => {
    uniqueCategories.add(exerciseDetail.Exercise.category);
  });

  const displayedExercises = routine.WorkoutPlanExercise;

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await handleDeleteRoutine(routine.id);
      if (response.success) {
        toast.success(response.message);
        onDeleteClose();
      } else {
        toast.error(response.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action: string) => {
    if (action === "delete") {
      onDeleteOpen();
    } else if (action === "edit") {
      router.push(`/edit-routine/step-1?id=${routine.id}`);
    } else if (action === "preview") {
      onPreviewOpen();
    }
    // Close dropdown after action
    if (toggleDropdown) {
      toggleDropdown(routine.id);
    }
  };

  // Calculate estimated workout duration
  const estimatedDuration = () => {
    let totalTime = 0;
    displayedExercises.forEach(exercise => {
      // Estimate ~45 seconds per set for reps-based exercises
      totalTime += 45 * exercise.sets;
    });
    // Add estimated rest time (60 seconds between sets)
    const totalSets = displayedExercises.reduce((sum, ex) => sum + ex.sets, 0);
    totalTime += (totalSets - 1) * 60;
    return Math.round(totalTime / 60); // Convert to minutes
  };

  return (
    <div className="relative group">
      <Card
        shadow="sm"
        className="border border-divider hover:shadow-lg transition-all duration-200 bg-background/90 backdrop-blur-sm h-[320px] flex flex-col"
      >
        {/* Header with title and menu */}
        <div className="flex items-start justify-between p-4 pb-3">
          <div className="flex-1 min-w-0 pr-3">
            <h3 className="text-lg font-semibold text-foreground leading-tight mb-2">
              {routine.name}
            </h3>

            {/* Training type and status chips */}
            <div className="flex flex-wrap gap-2 mb-2">
              {routine.trainingType && (
                <Chip
                  size="sm"
                  variant="flat"
                  color={trainingTypeColorMap[routine.trainingType] || "default"}
                  className="text-xs font-medium"
                  startContent={<IconBarbell size={12} />}
                >
                  {trainingTypeDisplayMap[routine.trainingType] || routine.trainingType}
                </Chip>
              )}

              {isAssigned && routine._assignmentStatus && (
                <Chip
                  size="sm"
                  color={routine._assignmentStatus === "PENDING" ? "warning" : "success"}
                  variant="solid"
                  className="text-xs font-medium"
                >
                  {routine._assignmentStatus.replace("_", " ")}
                </Chip>
              )}
            </div>

            {/* Assignment info */}
            {isAssigned && routine._assignedByAdmin && (
              <div className="flex items-center gap-1 text-xs text-foreground-500 mb-1">
                <IconUser size={12} />
                <span>
                  Assigned by {routine._assignedByAdmin.firstName || routine._assignedByAdmin.username || routine._assignedByAdmin.email || "Admin"}
                </span>
              </div>
            )}

            {/* Update date for personal workouts */}
            {!isSystem && !isAssigned && (
              <div className="flex items-center gap-1 text-xs text-foreground-500">
                <IconCalendar size={12} />
                <span>Updated {format(new Date(routine.updatedAt), "MMM dd, yyyy")}</span>
              </div>
            )}
          </div>

          {/* Menu Button - Positioned absolutely in top-right */}
          {((!isSystem && !isAssigned) || (isSystem && isAdmin)) && (
            <div className="relative" ref={dropdownRef}>
              <Button
                isIconOnly
                variant="light"
                size="sm"
                className="text-zinc-500 hover:text-zinc-700"
                onPress={() => toggleDropdown && toggleDropdown(routine.id)}
              >
                <IconDots size={16} />
              </Button>

              {/* Custom Dropdown Menu */}
              {openDropdown === routine.id && (
                <div className="absolute right-0 top-8 z-50 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg py-1 min-w-[140px]">
                  {/* Preview - Available for all users */}
                  <button
                    onClick={() => handleAction("preview")}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <IconEye size={16} />
                    Preview
                  </button>

                  {/* Edit option - Available for super admins only */}
                  {canEdit && (
                    <button
                      onClick={() => handleAction("edit")}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    >
                      <IconEdit size={16} />
                      Edit
                    </button>
                  )}

                  {/* Delete option - Available for super admins only */}
                  {canDelete && (
                    <button
                      onClick={() => handleAction("delete")}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <IconTrash size={16} />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <Divider />

        {/* Body with exercise list */}
        <div className="p-4 pt-3 flex-1 flex flex-col">
          {/* Quick stats */}
          <div className="flex items-center gap-4 text-sm text-foreground-600 mb-3">
            <div className="flex items-center gap-1">
              <IconBarbell size={14} />
              <span className="font-medium">{displayedExercises.length}</span>
              <span className="text-foreground-500">exercises</span>
            </div>
            <div className="flex items-center gap-1">
              <IconClock size={14} />
              <span className="font-medium">~{estimatedDuration()}</span>
              <span className="text-foreground-500">min</span>
            </div>
          </div>

          {/* Exercise list */}
          <div className="space-y-2 mb-4 flex-1">
            {displayedExercises
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .slice(0, 4) // Show only first 4 exercises
              .map((exerciseDetail, index) => (
                <div key={exerciseDetail.Exercise.id} className="flex items-center gap-2 text-sm">
                  <span className="text-primary font-medium text-xs bg-primary/10 rounded-full w-5 h-5 flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-foreground-700 font-medium">
                    {exerciseDetail.sets}x
                  </span>
                  <span className="text-foreground-600 truncate flex-1">
                    {exerciseDetail.Exercise.name}
                  </span>
                </div>
              ))}

            {displayedExercises.length > 4 && (
              <div className="text-xs text-foreground-500 pl-7">
                +{displayedExercises.length - 4} more exercises
              </div>
            )}
          </div>

          {/* Action button */}
          <div className="mt-auto">
          {!isAdmin ? (
            <Button
              variant={isCurrentWorkout ? "solid" : "flat"}
              color={isCurrentWorkout ? "success" : "primary"}
              as={Link}
              href={isAssigned && routine._assignmentId ?
                `/workout/${routine.id}?assignmentId=${routine._assignmentId}` :
                `/workout/${routine.id}`
              }
              size="md"
              className="w-full gap-2 font-medium"
              isDisabled={isAnotherWorkoutInProgress}
            >
              {isCurrentWorkout ? (
                <>
                  <IconPlayerPlayFilled size={18} />
                  Continue Workout
                </>
              ) : isAnotherWorkoutInProgress ? (
                "Another Workout in Progress"
              ) : (
                <>
                  <IconPlayerPlayFilled size={18} />
                  Start Workout
                </>
              )}
            </Button>
          ) : (
            <div className="w-full text-center p-3 bg-default-50 rounded-lg">
              <div className="text-sm text-foreground-600 font-medium">
                {routine.WorkoutPlanExercise.length} exercises • ~{estimatedDuration()} min
              </div>
            </div>
          )}
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <BottomSheet
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        title="Delete Routine"
        size="md"
        footer={
          <>
            <CustomButton variant="ghost" onPress={onDeleteClose}>
              Cancel
            </CustomButton>
            <CustomButton color="danger" onPress={handleDelete} isLoading={loading}>
              Delete
            </CustomButton>
          </>
        }
      >
        <p>Are you sure you want to delete this routine? This action cannot be undone.</p>
      </BottomSheet>

      {/* Workout Preview Modal */}
      <WorkoutPreview
        isOpen={isPreviewOpen}
        onClose={onPreviewClose}
        workoutId={routine.id}
      />
    </div>
  );
}
