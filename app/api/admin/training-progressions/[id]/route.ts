import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId },
      select: { role: true },
    });

    if (!userInfo || (userInfo.role !== "ADMIN" && userInfo.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const updateData = await request.json();

    // Calculate actual weeks if completing
    if (updateData.isCompleted && updateData.endDate) {
      const progression = await prisma.userTrainingProgression.findUnique({
        where: { id },
        select: { startDate: true },
      });

      if (progression) {
        const startDate = new Date(progression.startDate);
        const endDate = new Date(updateData.endDate);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const actualWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
        updateData.actualWeeks = actualWeeks;
      }
    }

    const updatedProgression = await prisma.userTrainingProgression.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Training progression updated successfully",
      progression: updatedProgression,
    });
  } catch (error) {
    console.error("Error updating training progression:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}