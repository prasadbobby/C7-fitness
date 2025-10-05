import prisma from "@/prisma/prisma";
import PageHeading from "@/components/PageHeading/PageHeading";
import WorkoutManager from "./_components/WorkoutManager";
import WorkoutManagerV2 from "./_components/WorkoutManagerV2";

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

  return (
    <>
      <PageHeading
        title={`Workout: ${workout.name}${isAdminMode ? ' (Admin Mode)' : ''}`}
      />
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
