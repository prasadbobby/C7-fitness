import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs';
import prisma from '@/prisma/prisma';

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const measurements = await prisma.bodyMeasurement.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        recordedDate: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      measurements
    });
  } catch (error) {
    console.error('Error fetching measurements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch measurements' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { measurementType, value, unit, recordedDate, notes } = body;

    // Validate required fields
    if (!measurementType || !value || !unit || !recordedDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
        { error: 'Invalid measurement type' },
        { status: 400 }
      );
    }

    // Use upsert to handle potential duplicates (unique constraint on userId, measurementType, recordedDate)
    const measurement = await prisma.bodyMeasurement.upsert({
      where: {
        userId_measurementType_recordedDate: {
          userId: user.id,
          measurementType: measurementType,
          recordedDate: new Date(recordedDate)
        }
      },
      update: {
        value: parseFloat(value),
        unit,
        notes: notes || null,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        measurementType,
        value: parseFloat(value),
        unit,
        recordedDate: new Date(recordedDate),
        notes: notes || null,
        dataSource: 'MANUAL',
      },
    });

    return NextResponse.json({
      success: true,
      measurement
    });
  } catch (error) {
    console.error('Error creating measurement:', error);
    return NextResponse.json(
      { error: 'Failed to create measurement' },
      { status: 500 }
    );
  }
}