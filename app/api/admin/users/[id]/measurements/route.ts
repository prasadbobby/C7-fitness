import { currentUser } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId: user.id },
      select: { role: true }
    });

    if (userInfo?.role !== 'ADMIN' && userInfo?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const targetUserId = params.id;

    // Fetch measurements for the target user
    const measurements = await prisma.bodyMeasurement.findMany({
      where: {
        userId: targetUserId,
      },
      orderBy: {
        recordedDate: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      measurements
    });

  } catch (error) {
    console.error("Error fetching user measurements:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId: user.id },
      select: { role: true }
    });

    if (userInfo?.role !== 'ADMIN' && userInfo?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const targetUserId = params.id;
    const body = await request.json();

    const { measurementType, value, unit, recordedDate, notes } = body;

    // Validate required fields
    if (!measurementType || !value || !unit || !recordedDate) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate measurement type
    const validTypes = [
      // Basic Metrics
      'DOB', 'METABOLIC_AGE', 'HEIGHT', 'WEIGHT',
      // Body Composition
      'BODY_FAT_PERCENTAGE', 'VISCERAL_FAT', 'SKELETAL_MUSCLE_MASS', 'FAT_MASS',
      // Upper Body Measurements
      'NECK', 'SHOULDERS', 'CHEST', 'UPPER_ARM_RIGHT', 'UPPER_ARM_LEFT',
      'FOREARM_RIGHT', 'FOREARM_LEFT', 'WRIST',
      // Core & Lower Body Measurements
      'WAIST', 'ABDOMEN', 'HIPS', 'THIGH_RIGHT', 'THIGH_LEFT',
      'CALF_RIGHT', 'CALF_LEFT'
    ];

    if (!validTypes.includes(measurementType)) {
      return NextResponse.json(
        { success: false, error: "Invalid measurement type" },
        { status: 400 }
      );
    }

    // Validate value is a positive number
    if (typeof value !== 'number' || value <= 0) {
      return NextResponse.json(
        { success: false, error: "Value must be a positive number" },
        { status: 400 }
      );
    }

    // Verify target user exists
    const targetUser = await prisma.userInfo.findUnique({
      where: { userId: targetUserId },
      select: { id: true }
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "Target user not found" },
        { status: 404 }
      );
    }

    // Use upsert to handle potential duplicates (unique constraint on userId, measurementType, recordedDate)
    const measurement = await prisma.bodyMeasurement.upsert({
      where: {
        userId_measurementType_recordedDate: {
          userId: targetUserId,
          measurementType: measurementType,
          recordedDate: new Date(recordedDate)
        }
      },
      update: {
        value,
        unit,
        notes: notes || null,
        updatedAt: new Date()
      },
      create: {
        userId: targetUserId,
        measurementType,
        value,
        unit,
        recordedDate: new Date(recordedDate),
        notes: notes || null
      }
    });

    return NextResponse.json({
      success: true,
      measurement
    });

  } catch (error) {
    console.error("Error creating measurement:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}