import { auth } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";
import NewRoutineFormStepOneClient from "./form.client";

export const dynamic = 'force-dynamic';

export default async function NewRoutineFormStepOne({
  searchParams,
}: {
  searchParams?: {
    id?: string;
  };
}) {
  const { userId }: { userId: string | null } = auth();

  if (!userId) {
    throw new Error("You must be signed in to view this page.");
  }

  const routineId = searchParams?.id || null;

  let routineName = "";
  let routineNotes = "";
  let routineTrainingType = null;
  let pageTitle = "New Routine";

  if (routineId !== null) {
    const routine = await prisma.workoutPlan.findUnique({
      where: {
        id: routineId,
      },
      select: {
        id: true,
        name: true,
        notes: true,
        trainingType: true,
      },
    });

    routineName = routine?.name || "";
    routineNotes = routine?.notes || "";
    routineTrainingType = routine?.trainingType || null;
    pageTitle = `Edit Routine: ${routineName}`;
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <NewRoutineFormStepOneClient
        routineId={routineId}
        routineName={routineName}
        routineNotes={routineNotes}
        routineTrainingType={routineTrainingType}
        pageTitle={pageTitle}
      />
    </div>
  );
}
