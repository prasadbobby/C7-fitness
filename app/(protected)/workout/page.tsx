import { auth } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import { Button } from "@nextui-org/button";
import { IconPlus } from "@tabler/icons-react";
import PageHeading from "@/components/PageHeading/PageHeading";
import RoutineCards from "./_components/RoutineCards";
import YourRoutinesSection from "./_components/YourRoutinesSection";
import { WorkoutPlan } from "@prisma/client";

export const dynamic = 'force-dynamic';

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

export default async function WorkoutPage() {
  const { userId }: { userId: string | null } = auth();

  if (!userId) {
    throw new Error("You must be signed in to view this page.");
  }

  // Fetch user role
  const userInfo = await prisma.userInfo.findUnique({
    where: { userId },
    select: { role: true },
  });

  const isAdmin = userInfo?.role === "ADMIN" || userInfo?.role === "SUPER_ADMIN";

  // Fetch assigned workouts
  const assignedWorkouts = await prisma.assignedWorkout.findMany({
    where: {
      userId: userId,
      status: {
        in: ["PENDING", "IN_PROGRESS"],
      },
    },
    orderBy: {
      assignedAt: "desc",
    },
    include: {
      workoutPlan: {
        include: {
          WorkoutPlanExercise: {
            include: {
              Exercise: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                },
              },
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      },
    },
  });

  // Fetch admin info for assigned workouts
  const adminIds = [...new Set(assignedWorkouts.map(aw => aw.assignedBy))];
  let adminMap = new Map();

  if (adminIds.length > 0) {
    // Get admin info from Clerk since UserInfo only has userId and role
    const { clerkClient } = await import("@clerk/nextjs");

    try {
      const adminUsers = await Promise.all(
        adminIds.map(async (adminId) => {
          try {
            const user = await clerkClient.users.getUser(adminId);
            return {
              userId: adminId,
              firstName: user.firstName,
              lastName: user.lastName,
              username: user.username,
              email: user.emailAddresses?.[0]?.emailAddress,
            };
          } catch (error) {
            // If user not found in Clerk, return basic info
            return {
              userId: adminId,
              firstName: null,
              lastName: null,
              username: null,
              email: null,
            };
          }
        })
      );

      adminMap = new Map(adminUsers.map(admin => [admin.userId, admin]));
    } catch (error) {
      console.error("Error fetching admin info:", error);
    }
  }

  // Get all workouts (user-created and admin-created system workouts)
  const routines: ExtendedWorkoutPlan[] = await prisma.workoutPlan.findMany({
    where: {
      OR: [
        { userId: userId }, // User's own workouts
        { userId: null },   // Admin-created system workouts (available to all users)
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
      notes: true,
      trainingType: true,
      WorkoutPlanExercise: {
        select: {
          sets: true,
          reps: true,
          exerciseDuration: true,
          order: true,
          Exercise: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      },
    },
  });

  const userRoutines = routines.filter((routine) => routine.userId === userId);
  const systemRoutines = routines.filter((routine) => routine.userId === null); // Admin-created workouts available to all

  return (
    <>
      <PageHeading title="Start Workout" />

      {assignedWorkouts.length > 0 && (
        <>
          <h2 className="font-semibold text-xl md:text-2xl mb-3">Assigned Workouts</h2>
          <RoutineCards
            routines={assignedWorkouts.map(aw => ({
              ...aw.workoutPlan,
              _assignmentId: aw.id,
              _assignmentStatus: aw.status,
              _assignedBy: aw.assignedBy,
              _assignedByAdmin: adminMap.get(aw.assignedBy),
            }))}
            isSystem={false}
            isAssigned={true}
            isAdmin={isAdmin}
          />
        </>
      )}

      {systemRoutines.length > 0 && (
        <>
          <h2 className="font-semibold text-xl md:text-2xl mb-3">Workout Library</h2>
          <RoutineCards
            routines={systemRoutines}
            isSystem={true}
            isAssigned={false}
            isAdmin={isAdmin}
          />
        </>
      )}

      <YourRoutinesSection userRoutines={userRoutines} isAdmin={isAdmin} />


      {/* Message for users with no workouts available */}
      {!isAdmin && assignedWorkouts.length === 0 && systemRoutines.length === 0 && userRoutines.length === 0 && (
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
