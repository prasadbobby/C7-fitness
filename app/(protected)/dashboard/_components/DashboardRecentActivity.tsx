import { auth } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";
import { format } from "date-fns";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Button } from "@nextui-org/button";

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m`;
}

// Helper function to format seconds to time display
function formatDurationFromSeconds(seconds?: number): string {
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
}

export default async function DashboardRecentActivity() {
  const { userId }: { userId: string | null } = auth();

  if (!userId) {
    throw new Error("You must be signed in to view this page.");
  }

  const recentActivity = await prisma.workoutLog.findMany({
    where: {
      userId: userId,
      inProgress: false,
    },
    take: 4,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      duration: true,
      createdAt: true,
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
    <>
      {recentActivity.length > 0 && (
        <>
          <h2 className="mb-3 mt-2 text-lg">Recent Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-3 mb-5">
            {recentActivity.map((activity) => {
              const totalWeight = activity.exercises.reduce(
                (total, exercise) => {
                  const exerciseWeight = exercise.sets.reduce(
                    (total, set) => total + (set.weight || 0),
                    0,
                  );
                  return total + exerciseWeight;
                },
                0,
              );

              const hasTimingData = activity.totalRestTimeSeconds !== null || activity.totalActiveTimeSeconds !== null;
              const totalRestTime = activity.totalRestTimeSeconds || 0;
              const totalActiveTime = activity.totalActiveTimeSeconds || 0;

              return (
                <Card key={activity.id} shadow="none" className="shadow-md">
                  <CardHeader className="flex gap-3 px-5 pt-4">
                    <div className="flex flex-col flex-grow">
                      <p className="text-md text-black dark:text-primary leading-5">
                        {activity.WorkoutPlan.name}
                      </p>
                      <p className="text-xs text-default-500 leading-5">
                        <span className="flex space-x-1">
                          <time>
                            {format(new Date(activity.createdAt), "MM/dd/yyyy")}
                          </time>
                          <span className="text-zinc-500">|</span>
                          <span>{formatDuration(activity.duration)}</span>
                          <span className="text-zinc-500">|</span>
                          <span>{totalWeight} KG</span>
                        </span>
                      </p>

                      {/* Enhanced Timing Information */}
                      {hasTimingData && (
                        <div className="mt-1 flex gap-2 text-xs">
                          <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded">
                            <div className="w-1 h-1 bg-primary rounded-full"></div>
                            <span className="text-primary-600">Active: {formatDurationFromSeconds(totalActiveTime)}</span>
                          </div>
                          <div className="flex items-center gap-1 px-2 py-1 bg-warning/10 rounded">
                            <div className="w-1 h-1 bg-warning rounded-full"></div>
                            <span className="text-warning-600">Rest: {formatDurationFromSeconds(totalRestTime)}</span>
                          </div>
                        </div>
                      )}
                    </div>
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
                          <p className="shrink-0">
                            {exercise.sets.length} Sets
                          </p>
                        </li>
                      ))}
                    </ul>
                  </CardBody>
                </Card>
              );
            })}
          </div>
          <div className="flex justify-center">
            <Button as={Link} href="/activity">
              View all activity
            </Button>
          </div>
        </>
      )}
    </>
  );
}
