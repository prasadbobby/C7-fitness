import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { auth } from "@clerk/nextjs";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const workoutId = params.id;

    if (!workoutId) {
      return NextResponse.json(
        { error: "Workout ID is required" },
        { status: 400 }
      );
    }

    // Get user role to check permissions
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId },
      select: { role: true },
    });

    const isAdmin = userInfo?.role === "ADMIN" || userInfo?.role === "SUPER_ADMIN";

    // Fetch the workout with exercises
    const workout = await prisma.workoutPlan.findUnique({
      where: { id: workoutId },
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
          orderBy: { order: "asc" },
        },
      },
    });

    if (!workout) {
      return NextResponse.json(
        { error: "Workout not found" },
        { status: 404 }
      );
    }

    // Check access permissions
    // Users can view:
    // 1. Their own workouts (userId matches)
    // 2. System workouts (userId is null) if they're assigned or admin
    // 3. Admins can view all workouts

    const canAccess =
      isAdmin || // Admins can view all workouts
      workout.userId === userId || // User's own workout
      workout.userId === null; // System workouts (everyone can view if they have access to the page)

    if (!canAccess) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json(workout);

  } catch (error) {
    console.error("Error fetching workout:", error);
    return NextResponse.json(
      { error: "Failed to fetch workout" },
      { status: 500 }
    );
  }
}