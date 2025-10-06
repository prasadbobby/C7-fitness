import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { requireAdmin } from "@/utils/adminAuth";
import { UserRole } from "@prisma/client";

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { role, age, height, weight } = body;

    const updatedUser = await prisma.userInfo.update({
      where: { id: params.id },
      data: {
        ...(role && { role: role as UserRole }),
        ...(age !== undefined && { age: age ? parseInt(age) : null }),
        ...(height !== undefined && { height: height ? parseFloat(height) : null }),
        ...(weight !== undefined && { weight: weight ? parseFloat(weight) : null }),
      },
      include: {
        _count: {
          select: {
            assignedWorkouts: true,
          },
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
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

    // Find the user to get their userId for Clerk deletion
    const user = await prisma.userInfo.findUnique({
      where: { id: params.id },
      select: { userId: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Delete related records first in correct order to handle foreign key constraints
    await prisma.ninetyDayChallengeComment.deleteMany({
      where: { userId: user.userId },
    });

    await prisma.ninetyDayChallengeReaction.deleteMany({
      where: { userId: user.userId },
    });

    await prisma.ninetyDayChallengePost.deleteMany({
      where: { userId: user.userId },
    });

    await prisma.ninetyDayChallengeParticipant.deleteMany({
      where: { userId: user.userId },
    });

    await prisma.stepChallengeParticipant.deleteMany({
      where: { userId: user.userId },
    });

    await prisma.stepLog.deleteMany({
      where: { userId: user.userId },
    });

    await prisma.stepGoal.deleteMany({
      where: { userId: user.userId },
    });

    await prisma.assignedWorkout.deleteMany({
      where: { userId: user.userId },
    });

    await prisma.favouriteExercise.deleteMany({
      where: { userId: user.userId },
    });

    await prisma.userExercisePB.deleteMany({
      where: { userId: user.userId },
    });

    await prisma.userGoal.deleteMany({
      where: { userId: user.userId },
    });

    await prisma.userEquipment.deleteMany({
      where: { userId: user.userId },
    });

    await prisma.workoutLog.deleteMany({
      where: { userId: user.userId },
    });

    // Finally delete the user from our database
    await prisma.userInfo.delete({
      where: { id: params.id },
    });

    // Optionally delete the user from Clerk as well
    try {
      const { clerkClient } = await import("@clerk/nextjs");
      await clerkClient.users.deleteUser(user.userId);
    } catch (clerkError) {
      console.warn("Could not delete user from Clerk:", clerkError);
      // Continue anyway since we've deleted from our database
    }

    return NextResponse.json({
      success: true,
      message: "User and all related data deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}