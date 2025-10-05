"use client";
import React from "react";
import { format } from "date-fns";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import { Chip } from "@nextui-org/chip";
import { Button } from "@nextui-org/button";
import Link from "next/link";
import { IconPlayerPlayFilled } from "@tabler/icons-react";
import RoutineMenu from "./RoutineMenu";
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
}: RoutineCardProps) {
  const isAnotherWorkoutInProgress =
    activeWorkoutRoutine !== null && activeWorkoutRoutine !== routine.id;
  const isCurrentWorkout = activeWorkoutRoutine === routine.id;
  const uniqueCategories = new Set();

  routine.WorkoutPlanExercise.forEach((exerciseDetail) => {
    uniqueCategories.add(exerciseDetail.Exercise.category);
  });

  const displayedExercises = routine.WorkoutPlanExercise;

  return (
    <Card key={routine.id} shadow="none" className="shadow-md">
      <CardHeader className="flex gap-3 px-5 pt-4">
        <div className="flex flex-col flex-grow">
          <p className="text-md leading-5">{routine.name}</p>
          {routine.trainingType && (
            <div className="flex gap-1 mt-1">
              <Chip
                size="sm"
                variant="flat"
                color={trainingTypeColorMap[routine.trainingType] || "default"}
                className="text-xs"
              >
                {trainingTypeDisplayMap[routine.trainingType] || routine.trainingType}
              </Chip>
            </div>
          )}
          {isAssigned && routine._assignmentStatus && (
            <>
              <Chip
                size="sm"
                color={routine._assignmentStatus === "PENDING" ? "warning" : "primary"}
                variant="flat"
              >
                {routine._assignmentStatus.replace("_", " ")}
              </Chip>
              {routine._assignedByAdmin && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Assigned by {routine._assignedByAdmin.firstName || routine._assignedByAdmin.username || routine._assignedByAdmin.email || "Admin"}
                </p>
              )}
            </>
          )}
          {!isSystem && !isAssigned && (
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-5">
              Updated: {format(new Date(routine.updatedAt), "MM/dd/yyyy")}
            </p>
          )}
        </div>
        {!isSystem && !isAssigned && <RoutineMenu routineId={routine.id} />}
      </CardHeader>

      <CardBody className="pt-0 px-5">
        <ul className="text-sm">
          {displayedExercises
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((exerciseDetail) => (
              <li key={exerciseDetail.Exercise.id} className="truncate">
                {exerciseDetail.sets && exerciseDetail.sets} x{" "}
                {exerciseDetail.Exercise.name}
              </li>
            ))}
        </ul>
      </CardBody>
      <CardFooter className="pt-0 px-5 pb-4 block">
        <Button
          variant="flat"
          as={Link}
          href={isAssigned && routine._assignmentId ?
            `/workout/${routine.id}?assignmentId=${routine._assignmentId}` :
            `/workout/${routine.id}`
          }
          size="sm"
          //color={isAnotherWorkoutInProgress ? "danger" : "primary"}
          className="gap-unit-1"
          isDisabled={isAnotherWorkoutInProgress}
        >
          {isCurrentWorkout ? (
            <>
              <IconPlayerPlayFilled size={16} />
              Continue Workout
            </>
          ) : isAnotherWorkoutInProgress ? (
            "Another Workout is in Progress"
          ) : (
            <>
              <IconPlayerPlayFilled size={16} />
              Start Workout
            </>
          )}
        </Button>
        <div className="lex-wrap gap-1 hidden">
          {Array.from(uniqueCategories as Set<string>).map(
            (category: string, index: number) => (
              <Chip
                radius="sm"
                size="sm"
                className="capitalize"
                color={
                  categoryColorMap[category as keyof typeof categoryColorMap] ||
                  "default"
                }
                key={index}
              >
                {category}
              </Chip>
            ),
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
