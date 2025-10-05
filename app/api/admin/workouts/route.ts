import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { requireAdmin } from "@/utils/adminAuth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { notes: { contains: search, mode: "insensitive" as const } },
            { trainingType: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [workouts, total] = await Promise.all([
      prisma.workoutPlan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          WorkoutPlanExercise: {
            include: {
              Exercise: {
                select: {
                  name: true,
                  category: true,
                },
              },
            },
            orderBy: { order: "asc" },
          },
          _count: {
            select: {
              assignedWorkouts: true,
              logs: true,
            },
          },
        },
      }),
      prisma.workoutPlan.count({ where }),
    ]);

    return NextResponse.json({ workouts, total, page, limit });
  } catch (error) {
    console.error("Error fetching workouts:", error);
    return NextResponse.json(
      { error: "Failed to fetch workouts" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const workoutId = searchParams.get("id");

    if (!workoutId) {
      return NextResponse.json(
        { error: "Workout ID is required" },
        { status: 400 }
      );
    }

    // Check if workout exists
    const workout = await prisma.workoutPlan.findUnique({
      where: { id: workoutId },
      include: {
        _count: {
          select: {
            assignedWorkouts: true,
            logs: true,
          },
        },
      },
    });

    if (!workout) {
      return NextResponse.json(
        { error: "Workout not found" },
        { status: 404 }
      );
    }

    // Check if workout has any assignments or logs
    if (workout._count.assignedWorkouts > 0 || workout._count.logs > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete workout with existing assignments or logs",
          details: {
            assignments: workout._count.assignedWorkouts,
            logs: workout._count.logs,
          }
        },
        { status: 400 }
      );
    }

    // Delete workout plan exercises first (foreign key constraint)
    await prisma.workoutPlanExercise.deleteMany({
      where: { workoutPlanId: workoutId },
    });

    // Delete the workout plan
    await prisma.workoutPlan.delete({
      where: { id: workoutId },
    });

    return NextResponse.json({
      message: "Workout deleted successfully",
      workoutId
    });
  } catch (error) {
    console.error("Error deleting workout:", error);
    return NextResponse.json(
      { error: "Failed to delete workout" },
      { status: 500 }
    );
  }
}