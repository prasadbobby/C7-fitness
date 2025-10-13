import prisma from "@/prisma/prisma";
import PageHeading from "@/components/PageHeading/PageHeading";
import WorkoutManager from "./_components/WorkoutManager";
import { clerkClient } from "@clerk/nextjs";

async function fetchRoutine(id: string) {
  return await prisma.workoutPlan.findUnique({
    where: {
      id: id,
    },
    select: {
      id: true,
      name: true,
      notes: true,
      WorkoutPlanExercise: {
        select: {
          Exercise: {
            select: {
              id: true,
              name: true,
            },
          },
          sets: true,
          reps: true,
          exerciseDuration: true,
          trackingType: true,
          order: true,
        },
      },
    },
  });
}

async function fetchUserInfo(targetUserDbId: string, targetUserId: string) {
  try {
    // Fetch user info from database
    const userInfo = await prisma.userInfo.findUnique({
      where: { id: targetUserDbId },
      select: { userId: true }
    });

    if (!userInfo) return null;

    // Fetch user details from Clerk
    const clerkUser = await clerkClient.users.getUser(targetUserId);

    return {
      name: clerkUser.firstName && clerkUser.lastName
        ? `${clerkUser.firstName} ${clerkUser.lastName}`
        : clerkUser.username || clerkUser.emailAddresses?.[0]?.emailAddress || 'Unknown User'
    };
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
}

export default async function StartWorkout({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { assignmentId?: string; adminMode?: string; targetUserId?: string; targetUserDbId?: string };
}) {
  const workout = await fetchRoutine(params.id);

  if (!workout) {
    throw new Error("Workout not found");
  }

  const isAdminMode = searchParams?.adminMode === 'true';
  const targetUserId = searchParams?.targetUserId;
  const targetUserDbId = searchParams?.targetUserDbId;

  // Fetch user info when in admin mode
  let userInfo = null;
  if (isAdminMode && targetUserId && targetUserDbId) {
    userInfo = await fetchUserInfo(targetUserDbId, targetUserId);
  }

  // Create title with user name if available
  let title = `Workout: ${workout.name}`;
  if (isAdminMode) {
    if (userInfo?.name) {
      title += ` - ${userInfo.name} (Admin Mode)`;
    } else {
      title += ' (Admin Mode)';
    }
  }

  return (
    <>
      <PageHeading title={title} />
      <WorkoutManager
        workout={workout}
        assignmentId={searchParams?.assignmentId}
        isAdminMode={isAdminMode}
        targetUserId={targetUserId}
        targetUserDbId={targetUserDbId}
      />
    </>
  );
}
