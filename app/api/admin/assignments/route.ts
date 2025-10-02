import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { requireAdmin } from "@/utils/adminAuth";
import { AssignmentStatus } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const assignments = await prisma.assignedWorkout.findMany({
      orderBy: { assignedAt: "desc" },
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
            isSystemRoutine: true,
          },
        },
      },
    });

    // Fetch Clerk user data for usernames
    const assignmentsWithClerkData = await Promise.all(
      assignments.map(async (assignment) => {
        try {
          const clerkUser = await clerkClient.users.getUser(assignment.user.userId);
          return {
            ...assignment,
            user: {
              ...assignment.user,
              username: clerkUser.username || clerkUser.firstName || clerkUser.emailAddresses[0]?.emailAddress || assignment.user.userId,
              email: clerkUser.emailAddresses[0]?.emailAddress,
              firstName: clerkUser.firstName,
              lastName: clerkUser.lastName,
            }
          };
        } catch (error) {
          return {
            ...assignment,
            user: {
              ...assignment.user,
              username: assignment.user.userId,
              email: null,
              firstName: null,
              lastName: null,
            }
          };
        }
      })
    );

    return NextResponse.json({ assignments: assignmentsWithClerkData });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAdmin();
    const body = await request.json();
    const { userId: targetUserId, workoutPlanId, notes, assignmentDate: assignmentDateInput } = body;

    // Use provided assignment date or default to today
    const assignmentDate = assignmentDateInput ? new Date(assignmentDateInput) : new Date();
    const startOfDay = new Date(assignmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(assignmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Note: Removed unique constraint check since same workout can now be assigned on different dates

    // Check if user already has any workout assigned for the same day
    const existingAssignmentOnSameDay = await prisma.assignedWorkout.findFirst({
      where: {
        userId: targetUserId,
        assignedAt: {
          gte: startOfDay,
          lte: endOfDay,
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

    if (existingAssignmentOnSameDay) {
      const formattedDate = assignmentDate.toLocaleDateString();
      return NextResponse.json(
        {
          error: "USER_ALREADY_HAS_WORKOUT_TODAY",
          message: `User already has "${existingAssignmentOnSameDay.workoutPlan.name}" workout assigned for ${formattedDate}`,
          existingWorkout: existingAssignmentOnSameDay.workoutPlan.name,
          date: formattedDate
        },
        { status: 400 }
      );
    }

    // Create the assignment
    const assignment = await prisma.assignedWorkout.create({
      data: {
        userId: targetUserId,
        workoutPlanId,
        assignedBy: userId,
        notes,
        assignedAt: assignmentDate,
        status: AssignmentStatus.PENDING,
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
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 }
    );
  }
}