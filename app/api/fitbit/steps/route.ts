import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { fitbitService } from "@/services/fitbitService";
import prisma from "@/prisma/prisma";

export const dynamic = 'force-dynamic';

// POST - Fetch steps data from Fitbit for specific date range
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

    console.log(`\n=== FITBIT STEPS API REQUEST ===`);
    console.log(`User: ${userId}`);
    console.log(`Date range: ${start.toISOString()} to ${end.toISOString()}`);

    // Check if user has Fitbit connection
    const connectionStatus = await fitbitService.getConnectionStatus(userId);

    if (!connectionStatus.isConnected) {
      return NextResponse.json(
        { error: "No active Fitbit connection found" },
        { status: 400 }
      );
    }

    // Fetch data from database first (much faster)
    const historicalData = await fitbitService.getHistoricalData(userId, start, end);

    // If we don't have data for some dates, sync only missing dates
    const existingDates = new Set(historicalData.map(d => d.date.split('T')[0]));
    const currentDate = new Date(start);
    const datesToSync = [];

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (!existingDates.has(dateStr)) {
        datesToSync.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Sync only missing dates to avoid unnecessary API calls
    if (datesToSync.length > 0) {
      console.log(`📅 Syncing ${datesToSync.length} missing dates...`);
      for (const dateToSync of datesToSync) {
        const endOfDay = new Date(dateToSync);
        endOfDay.setHours(23, 59, 59, 999);
        try {
          await fitbitService.syncStepsData(userId, dateToSync, endOfDay);
        } catch (error) {
          console.error(`Failed to sync ${dateToSync.toDateString()}:`, error);
        }
      }

      // Fetch updated data from database
      const updatedData = await fitbitService.getHistoricalData(userId, start, end);
      return NextResponse.json({
        success: true,
        data: updatedData,
        count: updatedData.length,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString()
        },
        source: 'DATABASE_WITH_SYNC'
      });
    }

    const stepsData = historicalData;

    console.log(`Fitbit steps data fetched: ${stepsData.length} records`);

    return NextResponse.json({
      success: true,
      data: stepsData,
      count: stepsData.length,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      source: 'DATABASE'
    });

  } catch (error) {
    console.error("Error in Fitbit steps API:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch Fitbit steps data",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET - Get recent steps data
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

    console.log(`\n=== FITBIT STEPS API GET REQUEST ===`);
    console.log(`User: ${userId}`);
    console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Check connection and auto-sync if enabled
    const connectionStatus = await fitbitService.getConnectionStatus(userId);

    let stepsData = [];

    if (connectionStatus.isConnected) {
      // Get data from database first
      stepsData = await fitbitService.getHistoricalData(userId, startDate, endDate);

      // Auto-sync only today's data to keep it fresh
      const today = new Date();
      const todayStart = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0));
      const todayEnd = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999));

      if (todayStart >= startDate && todayStart <= endDate) {
        try {
          await fitbitService.syncStepsData(userId, todayStart, todayEnd);
          // Refresh data after sync
          stepsData = await fitbitService.getHistoricalData(userId, startDate, endDate);
        } catch (syncError) {
          console.error("Auto-sync failed:", syncError);
          // Continue with existing data even if sync fails
        }
      }
    } else {
      // No Fitbit connection, get data from StepLog table
      const stepLogs = await prisma.stepLog.findMany({
        where: {
          userId,
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: [
          { date: 'asc' },
          { dataSource: 'desc' } // Prioritize FITBIT over MANUAL/GOOGLE_FIT
        ],
        select: {
          id: true,
          date: true,
          actualSteps: true,
          targetSteps: true,
          isCompleted: true,
          dataSource: true,
          lastUpdated: true
        }
      });

      stepsData = stepLogs.map(log => ({
        date: log.date.toISOString(),
        actualSteps: log.actualSteps,
        targetSteps: log.targetSteps,
        isCompleted: log.isCompleted,
        dataSource: log.dataSource
      }));
    }

    console.log(`Steps data fetched: ${stepsData.length} records`);

    return NextResponse.json({
      success: true,
      data: stepsData,
      count: stepsData.length,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      fitbitConnected: connectionStatus.isConnected
    });

  } catch (error) {
    console.error("Error in Fitbit steps API GET:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch steps data",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}