import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { googleFitnessService } from "@/services/googleFitnessService";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { startDate, endDate } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    console.log(`\n=== STEPS API REQUEST ===`);
    console.log(`User: ${userId}`);
    console.log(`Date range: ${start.toISOString()} to ${end.toISOString()}`);

    // Fetch steps data using the updated service with direct fetch
    const stepsData = await googleFitnessService.fetchStepsData(userId, start, end);

    console.log(`Steps data fetched: ${stepsData.length} records`);
    console.log("Steps data:", JSON.stringify(stepsData, null, 2));

    return NextResponse.json({
      success: true,
      data: stepsData,
      count: stepsData.length,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    });

  } catch (error) {
    console.error("Error in steps API:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch steps data",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    console.log(`\n=== STEPS API GET REQUEST ===`);
    console.log(`User: ${userId}`);
    console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Fetch steps data using the updated service with direct fetch
    const stepsData = await googleFitnessService.fetchStepsData(userId, startDate, endDate);

    console.log(`Steps data fetched: ${stepsData.length} records`);

    return NextResponse.json({
      success: true,
      data: stepsData,
      count: stepsData.length,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    });

  } catch (error) {
    console.error("Error in steps API GET:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch steps data",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}