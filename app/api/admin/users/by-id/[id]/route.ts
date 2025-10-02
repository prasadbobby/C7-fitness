import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { requireAdmin } from "@/utils/adminAuth";
import { UserRole } from "@prisma/client";

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

    // Delete related records first
    await prisma.assignedWorkout.deleteMany({
      where: { userId: params.id },
    });

    await prisma.favouriteExercise.deleteMany({
      where: { userId: params.id },
    });

    await prisma.userExercisePB.deleteMany({
      where: { userId: params.id },
    });

    await prisma.userGoal.deleteMany({
      where: { userId: params.id },
    });

    await prisma.userEquipment.deleteMany({
      where: { userId: params.id },
    });

    await prisma.workoutLog.deleteMany({
      where: { userId: params.id },
    });

    // Finally delete the user
    await prisma.userInfo.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}