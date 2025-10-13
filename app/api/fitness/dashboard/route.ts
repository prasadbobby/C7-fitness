import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's fitness data from various sources
    const [stepLog, heartRateData, caloriesData, distanceData] = await Promise.all([
      // Steps data
      prisma.stepLog.findFirst({
        where: {
          userId,
          date: today
        }
      }),

      // Heart rate data
      prisma.heartRateData.findFirst({
        where: {
          userId,
          date: today
        }
      }),

      // Calories data
      prisma.caloriesData.findFirst({
        where: {
          userId,
          date: today
        }
      }),

      // Distance data
      prisma.distanceData.findFirst({
        where: {
          userId,
          date: today
        }
      })
    ]);

    // Build response object
    const fitnessData: any = {};

    if (stepLog) {
      fitnessData.steps = {
        today: stepLog.actualSteps,
        target: stepLog.targetSteps,
        source: stepLog.dataSource
      };
    }

    if (heartRateData) {
      fitnessData.heartRate = {
        average: heartRateData.averageHeartRate,
        max: heartRateData.maxHeartRate,
        min: heartRateData.minHeartRate,
        date: heartRateData.date.toISOString()
      };
    }

    if (caloriesData) {
      fitnessData.calories = {
        burned: caloriesData.caloriesBurned,
        date: caloriesData.date.toISOString()
      };
    }

    if (distanceData) {
      fitnessData.distance = {
        meters: distanceData.totalDistance,
        date: distanceData.date.toISOString()
      };
    }

    return NextResponse.json(fitnessData);
  } catch (error) {
    console.error("Error fetching fitness dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch fitness data" },
      { status: 500 }
    );
  }
}