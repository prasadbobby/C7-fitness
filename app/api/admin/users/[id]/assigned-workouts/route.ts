import { auth, clerkClient } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId },
      select: { role: true },
    });

    if (!userInfo || (userInfo.role !== "ADMIN" && userInfo.role !== "SUPER_ADMIN")) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const userDbId = params.id;

    // Get user info using database ID
    const user = await prisma.userInfo.findUnique({
      where: { id: userDbId },
      select: {
        id: true,
        userId: true, // This is the Clerk user ID
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get user details from Clerk
    let clerkUser;
    try {
      clerkUser = await clerkClient.users.getUser(user.userId);
    } catch (error) {
      console.error("Error fetching user from Clerk:", error);
      clerkUser = null;
    }

    // Get assigned workouts for this user using their Clerk userId
    const assignedWorkouts = await prisma.assignedWorkout.findMany({
      where: {
        userId: user.userId, // Use the Clerk userId from the database
      },
      select: {
        id: true,
        status: true,
        assignedAt: true,
        dueDate: true,
        notes: true,
        workoutPlan: {
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                WorkoutPlanExercise: true,
              },
            },
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });

    return NextResponse.json({
      user: {
        ...user,
        displayName: clerkUser
          ? (clerkUser.username ||
             `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
             clerkUser.primaryEmailAddress?.emailAddress ||
             user.userId)
          : user.userId,
        imageUrl: clerkUser?.imageUrl || null,
      },
      assignedWorkouts,
    });
  } catch (error) {
    console.error("Error fetching assigned workouts:", error);
    return NextResponse.json(
      { error: "Failed to fetch assigned workouts" },
      { status: 500 }
    );
  }
}