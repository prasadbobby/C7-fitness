import { auth } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";
import { format } from "date-fns";
import FormatDuration from "@/utils/FormatDuration";
import Link from "next/link";
import { Card, CardHeader, CardBody } from "@nextui-org/card";
import ActivityMenu from "./ActivityMenu";
import ActivityModal from "./ActivityModal";
import { ActivityModalProvider } from "@/contexts/ActivityModalContext";

// Helper function to format seconds to time display
const formatDuration = (seconds?: number): string => {
  if (!seconds || seconds === 0) return "0s";

  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
};

export default async function ActivityList() {
  const { userId }: { userId: string | null } = auth();

  if (!userId) {
    throw new Error("You must be signed in to view this page.");
  }

  const workouts = await prisma.workoutLog.findMany({
    where: {
      userId: userId,
      inProgress: false,
    },
    orderBy: {
      date: "desc",
    },
    select: {
      id: true,
      duration: true,
      date: true,
      totalRestTimeSeconds: true,    // Include rest time data
      totalActiveTimeSeconds: true,  // Include active time data
      WorkoutPlan: {
        select: {
          name: true,
        },
      },
      exercises: {
        select: {
          id: true,
          exerciseId: true,
          trackingType: true,
          Exercise: {
            select: {
              name: true,
            },
          },
          sets: {
            select: {
              weight: true,
              reps: true,
              exerciseDuration: true,
              restTimeSeconds: true,     // Include per-set rest time
            },
          },
        },
      },
    },
  });

  return (
    <ActivityModalProvider>
      {workouts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
          {workouts.map((activity) => {
            const totalWeight = activity.exercises.reduce((total, exercise) => {
              const exerciseWeight = exercise.sets.reduce(
                (total, set) => total + (set.weight || 0),
                0,
              );
              return total + exerciseWeight;
            }, 0);

            const hasTimingData = activity.totalRestTimeSeconds !== null || activity.totalActiveTimeSeconds !== null;
            const totalRestTime = activity.totalRestTimeSeconds || 0;
            const totalActiveTime = activity.totalActiveTimeSeconds || 0;

            return (
              <Card key={activity.id} shadow="none" className="shadow-md">
                <CardHeader className="px-5 pt-4 flex-col items-start">
                  <div className="flex justify-between gap-2 w-full items-center">
                    <div className="tracking-tight grow">
                      <time>
                        {format(new Date(activity.date), "dd/MM/yyyy")}
                      </time>
                      <span className="text-zinc-500"> | </span>
                      <span>
                        <FormatDuration seconds={activity.duration} />
                      </span>
                      <span className="text-zinc-500"> | </span>
                      <span>{totalWeight} Kg</span>
                    </div>
                    <ActivityMenu activity={activity} />
                  </div>
                  <p className="text-sm text-zinc-400 leading-5">
                    {activity.WorkoutPlan.name}
                  </p>

                  {/* Enhanced Timing Information */}
                  {hasTimingData && (
                    <div className="mt-2 flex gap-2 text-xs">
                      <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        <span className="text-primary-600">Active: {formatDuration(totalActiveTime)}</span>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-warning/10 rounded">
                        <div className="w-1.5 h-1.5 bg-warning rounded-full"></div>
                        <span className="text-warning-600">Rest: {formatDuration(totalRestTime)}</span>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardBody className="pt-0 px-5 pb-4">
                  <ul>
                    {activity.exercises.map((exercise) => (
                      <li
                        key={exercise.id}
                        className="flex gap-1 justify-between text-sm"
                      >
                        <p className="grow truncate">
                          {exercise.Exercise.name}
                        </p>
                        <p className="shrink-0">{exercise.sets.length} Sets</p>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            );
          })}
          <ActivityModal />
        </div>
      ) : (
        <p>
          No workouts have been completed.{" "}
          <Link className="text-danger dark:text-primary" href="/workout">
            Click here to start one
          </Link>
          .
        </p>
      )}
    </ActivityModalProvider>
  );
}
