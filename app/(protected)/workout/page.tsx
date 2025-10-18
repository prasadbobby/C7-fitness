import { auth } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";
import { Prisma } from "@prisma/client";
import PageHeading from "@/components/PageHeading/PageHeading";
import WorkoutPageClient from "./_components/WorkoutPageClient";
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
  const adminIds = Array.from(new Set(assignedWorkouts.map(aw => aw.assignedBy)));
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

  // Get workouts based on user role
  let routineQuery: Prisma.WorkoutPlanFindManyArgs;

  if (isAdmin) {
    // Get all super admin user IDs to include their workouts in the library
    const superAdminUsers = await prisma.userInfo.findMany({
      where: { role: "SUPER_ADMIN" },
      select: { userId: true },
    });
    const superAdminUserIds = superAdminUsers.map(user => user.userId);

    // Admins and Super Admins can see all admin-created workouts AND all super admin created workouts
    routineQuery = {
      where: {
        OR: [
          { userId: null }, // System workouts (created from admin panel)
          { userId: { in: superAdminUserIds } }, // Workouts created by any super admin
        ],
      },
    };

    // Note: Removed "My Custom Workouts" section since all super admin workouts are now shown in the library
    // This eliminates duplicate workout displays
  } else {
    // Regular users only see their assigned workouts (handled separately above)
    // They don't see any workouts in the library section
    routineQuery = {
      where: {
        id: "no-workouts-for-users", // This will return empty results
      },
    };
  }

  const workoutSelectOptions = {
    orderBy: {
      createdAt: "desc" as const,
    },
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
          order: "asc" as const,
        },
      },
    },
  };

  const routines: ExtendedWorkoutPlan[] = await prisma.workoutPlan.findMany({
    ...routineQuery,
    ...workoutSelectOptions,
  });

  // Note: No longer fetching user routines separately since they're included in the main library

  const systemRoutines = routines; // All fetched routines are system routines (admin-created)

  return (
    <>
      <PageHeading title="Start Workout" />
      <WorkoutPageClient
        assignedWorkouts={assignedWorkouts.map(aw => ({
          ...aw.workoutPlan,
          _assignmentId: aw.id,
          _assignmentStatus: aw.status,
          _assignedBy: aw.assignedBy,
          _assignedByAdmin: adminMap.get(aw.assignedBy),
        }))}
        systemRoutines={systemRoutines}
        isAdmin={isAdmin}
        userRole={userInfo?.role}
      />
    </>
  );
}
