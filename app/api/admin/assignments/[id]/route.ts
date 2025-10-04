import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { requireAdmin } from "@/utils/adminAuth";
import { AssignmentStatus } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { status, notes, assignmentDate } = body;

    // Get the current assignment to check if we're changing the date
    const currentAssignment = await prisma.assignedWorkout.findUnique({
      where: { id: params.id },
      select: {
        userId: true,
        assignedAt: true,
      },
    });

    if (!currentAssignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // If assignmentDate is being updated, validate one-workout-per-day rule
    if (assignmentDate !== undefined) {
      const newAssignmentDate = assignmentDate ? new Date(assignmentDate) : new Date();
      const currentDate = new Date(currentAssignment.assignedAt);

      // Only check if the date is actually changing
      if (newAssignmentDate.toDateString() !== currentDate.toDateString()) {
        const startOfDay = new Date(newAssignmentDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(newAssignmentDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Get the current assignment's workout plan ID
        const currentAssignmentFull = await prisma.assignedWorkout.findUnique({
          where: { id: params.id },
          select: {
            workoutPlanId: true,
          },
        });

        // Check if user already has the same workout assigned for the new date (excluding current assignment)
        const newAssignmentDateString = newAssignmentDate.toISOString().split('T')[0];
        const existingAssignments = await prisma.assignedWorkout.findMany({
          where: {
            userId: currentAssignment.userId,
            id: {
              not: params.id, // Exclude the current assignment being updated
            },
          },
          include: {
            workoutPlan: {
              select: {
                name: true,
              },
            },
          },
        });

        // Check for duplicate assignment of same workout on same date
        const duplicateAssignment = existingAssignments.find(assignment => {
          const existingDateString = assignment.assignedAt.toISOString().split('T')[0];
          return existingDateString === newAssignmentDateString && assignment.workoutPlanId === currentAssignmentFull?.workoutPlanId;
        });

        if (duplicateAssignment) {
          const formattedDate = newAssignmentDate.toLocaleDateString();
          return NextResponse.json(
            {
              error: "DUPLICATE_WORKOUT_ASSIGNMENT",
              message: `User already has "${duplicateAssignment.workoutPlan.name}" workout assigned for ${formattedDate}`,
              existingWorkout: duplicateAssignment.workoutPlan.name,
              date: formattedDate
            },
            { status: 400 }
          );
        }
      }
    }

    const assignment = await prisma.assignedWorkout.update({
      where: { id: params.id },
      data: {
        ...(status && { status: status as AssignmentStatus }),
        ...(notes !== undefined && { notes }),
        ...(assignmentDate !== undefined && { assignedAt: assignmentDate ? new Date(assignmentDate) : new Date() }),
      },
      include: {
        user: {
          select: {
            userId: true,
            role: true,
          },
        },
        workoutPlan: {
          select: {
            name: true,
            systemRoutineCategory: true,
          },
        },
      },
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Error updating assignment:", error);
    return NextResponse.json(
      { error: "Failed to update assignment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    await prisma.assignedWorkout.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment" },
      { status: 500 }
    );
  }
}