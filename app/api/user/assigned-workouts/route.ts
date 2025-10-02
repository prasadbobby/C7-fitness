import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";
import { AssignmentStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get assigned workouts for the current user
    const assignedWorkouts = await prisma.assignedWorkout.findMany({
      where: {
        userId: userId,
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
                    instructions: true,
                    primary_muscles: true,
                    equipment: true,
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

    return NextResponse.json({ assignedWorkouts });
  } catch (error) {
    console.error("Error fetching assigned workouts:", error);
    return NextResponse.json(
      { error: "Failed to fetch assigned workouts" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { assignmentId, status } = body;

    // Update assignment status
    const updatedAssignment = await prisma.assignedWorkout.update({
      where: {
        id: assignmentId,
        userId: userId, // Ensure user can only update their own assignments
      },
      data: {
        status: status as AssignmentStatus,
      },
    });

    return NextResponse.json(updatedAssignment);
  } catch (error) {
    console.error("Error updating assignment status:", error);
    return NextResponse.json(
      { error: "Failed to update assignment status" },
      { status: 500 }
    );
  }
}