import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";

export async function GET(request: NextRequest) {
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

    // Fetch all training progressions
    const progressions = await prisma.userTrainingProgression.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      progressions,
      total: progressions.length,
    });
  } catch (error) {
    console.error("Error fetching training progressions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const { targetUserId, trainingType, targetWeeks, notes } = await request.json();

    // Validate required fields
    if (!targetUserId || !trainingType) {
      return NextResponse.json(
        { error: "Target user ID and training type are required" },
        { status: 400 }
      );
    }

    // Check if user already has an active training progression
    const existingProgression = await prisma.userTrainingProgression.findFirst({
      where: {
        userId: targetUserId,
        isActive: true,
      },
    });

    if (existingProgression) {
      return NextResponse.json(
        {
          error: "User already has an active training progression",
          existingProgression: existingProgression.trainingType
        },
        { status: 409 }
      );
    }

    // Create new training progression
    const progression = await prisma.userTrainingProgression.create({
      data: {
        userId: targetUserId,
        trainingType,
        targetWeeks: targetWeeks || 4,
        assignedBy: userId,
        notes,
      },
    });

    return NextResponse.json({
      message: "Training progression assigned successfully",
      progression,
    });
  } catch (error) {
    console.error("Error creating training progression:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}