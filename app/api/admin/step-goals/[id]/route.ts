import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { requireAdmin } from "@/utils/adminAuth";

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id } = params;

    const { dailyTarget, endDate, notes, isActive } = body;

    const stepGoal = await prisma.stepGoal.update({
      where: { id },
      data: {
        ...(dailyTarget && { dailyTarget: parseInt(dailyTarget) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(notes !== undefined && { notes }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ stepGoal });
  } catch (error) {
    console.error("Error updating step goal:", error);
    return NextResponse.json(
      { error: "Failed to update step goal" },
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
    const { id } = params;

    await prisma.stepGoal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting step goal:", error);
    return NextResponse.json(
      { error: "Failed to delete step goal" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const { id } = params;

    const stepGoal = await prisma.stepGoal.findUnique({
      where: { id },
      include: {
        stepLogs: {
          orderBy: { date: "desc" },
          take: 30, // Last 30 days
        },
      },
    });

    if (!stepGoal) {
      return NextResponse.json(
        { error: "Step goal not found" },
        { status: 404 }
      );
    }

    // Get user info
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId: stepGoal.userId },
    });

    return NextResponse.json({
      stepGoal: {
        ...stepGoal,
        userInfo,
      }
    });
  } catch (error) {
    console.error("Error fetching step goal:", error);
    return NextResponse.json(
      { error: "Failed to fetch step goal" },
      { status: 500 }
    );
  }
}