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
            { systemRoutineCategory: { contains: search, mode: "insensitive" as const } },
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