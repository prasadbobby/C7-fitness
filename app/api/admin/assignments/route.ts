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
    let assignmentDate;
    if (assignmentDateInput) {
      // Parse date string and create date in local timezone
      assignmentDate = new Date(assignmentDateInput + 'T00:00:00');
    } else {
      assignmentDate = new Date();
    }

    // Create date range for the assignment day (using date string comparison to avoid timezone issues)
    const assignmentDateString = assignmentDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log('Assignment validation:', {
      targetUserId,
      assignmentDateInput,
      assignmentDateString,
      assignmentDate: assignmentDate.toISOString()
    });

    // Note: Removed unique constraint check since same workout can now be assigned on different dates

    // Check if user already has any workout assigned for the same day using date string comparison
    const existingAssignments = await prisma.assignedWorkout.findMany({
      where: {
        userId: targetUserId,
      },
      include: {
        workoutPlan: {
          select: {
            name: true,
          },
        },
      },
    });

    // Filter assignments to find the same workout on the same date (prevent exact duplicates only)
    const duplicateAssignment = existingAssignments.find(assignment => {
      const existingDateString = assignment.assignedAt.toISOString().split('T')[0];
      return existingDateString === assignmentDateString && assignment.workoutPlanId === workoutPlanId;
    });

    console.log('Duplicate assignment check result:', {
      totalAssignments: existingAssignments.length,
      assignmentDates: existingAssignments.map(a => ({
        date: a.assignedAt.toISOString().split('T')[0],
        workoutPlanId: a.workoutPlanId,
        workoutName: a.workoutPlan.name
      })),
      lookingForDate: assignmentDateString,
      lookingForWorkoutPlanId: workoutPlanId,
      found: !!duplicateAssignment,
      duplicateAssignment: duplicateAssignment ? {
        id: duplicateAssignment.id,
        assignedAt: duplicateAssignment.assignedAt.toISOString(),
        workoutName: duplicateAssignment.workoutPlan.name
      } : null
    });

    if (duplicateAssignment) {
      const formattedDate = assignmentDate.toLocaleDateString();
      return NextResponse.json(
        {
          error: "DUPLICATE_WORKOUT_ASSIGNMENT",
          message: `User already has "${duplicateAssignment.workoutPlan.name}" workout assigned for ${formattedDate}. Cannot assign the same workout twice on the same day.`,
          existingWorkout: duplicateAssignment.workoutPlan.name,
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