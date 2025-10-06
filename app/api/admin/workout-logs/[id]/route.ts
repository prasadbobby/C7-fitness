import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { requireAdmin } from "@/utils/adminAuth";

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const { id } = params;
    const body = await request.json();
    const { date, duration, exercises } = body;

    console.log("Received workout update request:", {
      id,
      body: JSON.stringify(body, null, 2)
    });

    // Validate required fields
    if (!date || duration === undefined || duration === null || !exercises) {
      console.log("Validation failed:", { date, duration, exercises });
      return NextResponse.json(
        { error: "Missing required fields", received: { date, duration, exercises } },
        { status: 400 }
      );
    }

    // Validate exercises array
    if (!Array.isArray(exercises) || exercises.length === 0) {
      console.log("Invalid exercises array:", exercises);
      return NextResponse.json(
        { error: "Invalid exercises array", received: exercises },
        { status: 400 }
      );
    }

    // Validate each exercise
    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i];
      if (!exercise.id || !Array.isArray(exercise.sets)) {
        console.log(`Invalid exercise at index ${i}:`, exercise);
        return NextResponse.json(
          { error: `Invalid exercise at index ${i}`, received: exercise },
          { status: 400 }
        );
      }
    }

    // Update workout log basic info
    await prisma.workoutLog.update({
      where: { id },
      data: {
        date: new Date(date),
        duration,
        date_updated: new Date(),
      },
    });

    // Update each exercise's sets
    for (const exercise of exercises) {
      const { id: exerciseId, sets } = exercise;

      console.log("Processing exercise:", { exerciseId, setsCount: sets?.length });

      // Get current sets for this exercise
      const currentSets = await prisma.setLog.findMany({
        where: {
          workoutLogExerciseId: exerciseId,
        },
        orderBy: { id: 'asc' },
      });

      console.log("Current sets found:", currentSets.length);

      // Update existing sets and create new ones if needed
      for (let i = 0; i < sets.length; i++) {
        console.log(`Processing set ${i + 1}:`, sets[i]);

        const setData = {
          weight: sets[i].weight,
          reps: sets[i].reps,
          exerciseDuration: sets[i].exerciseDuration,
        };

        console.log("Set data prepared:", setData);

        if (i < currentSets.length) {
          // Update existing set
          await prisma.setLog.update({
            where: { id: currentSets[i].id },
            data: setData,
          });
        } else {
          // Create new set
          await prisma.setLog.create({
            data: {
              ...setData,
              workoutLogExerciseId: exerciseId,
            },
          });
        }
      }

      // Delete extra sets if we have fewer sets than before
      if (sets.length < currentSets.length) {
        const setsToDelete = currentSets.slice(sets.length);
        await prisma.setLog.deleteMany({
          where: {
            id: {
              in: setsToDelete.map(set => set.id),
            },
          },
        });
      }
    }

    return NextResponse.json({ success: true, message: "Workout updated successfully" });

  } catch (error) {
    console.error("Error updating workout log:", error);
    return NextResponse.json(
      { error: "Failed to update workout log", details: error.message },
      { status: 500 }
    );
  }
}