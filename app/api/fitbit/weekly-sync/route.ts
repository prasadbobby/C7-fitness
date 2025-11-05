import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { fitbitService } from "@/services/fitbitService";
import prisma from "@/prisma/prisma";

export const dynamic = 'force-dynamic';

/**
 * Weekly Fitbit Step Sync API
 *
 * Fetches entire week of step data from Fitbit and stores in database
 * Week starts from Monday (not Sunday)
 * This is called when user opens step tracking dashboard
 */

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`\n=== WEEKLY FITBIT SYNC ===`);
    console.log(`User: ${userId}`);

    // Check if user has Fitbit connection
    const connectionStatus = await fitbitService.getConnectionStatus(userId);

    if (!connectionStatus.isConnected) {
      return NextResponse.json(
        { error: "No active Fitbit connection found" },
        { status: 400 }
      );
    }

    // Calculate Monday-based week dates using IST timezone (like step-dashboard)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istNow = new Date(now.getTime() + istOffset);
    const today = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0, 0));

    const currentDay = today.getDay();

    // If today is Monday, show the week that just ended (includes yesterday's Sunday)
    // Otherwise show the current ongoing week
    let weekStartDate;
    if (currentDay === 1) { // Monday
      // Show previous week (Mon-Sun) that just completed
      weekStartDate = new Date(today.getTime());
      weekStartDate.setUTCDate(today.getUTCDate() - 7);
    } else {
      // Show current ongoing week
      const mondayOffset = currentDay === 0 ? 6 : currentDay - 1;
      weekStartDate = new Date(today.getTime());
      weekStartDate.setUTCDate(today.getUTCDate() - mondayOffset);
    }

    // Get Monday of the target week (use UTC methods to avoid timezone issues)
    const weekStart = new Date(weekStartDate.getTime());
    weekStart.setUTCHours(0, 0, 0, 0);

    // Get Sunday of the target week
    const weekEnd = new Date(weekStart.getTime());
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    console.log(`Week range: ${weekStart.toDateString()} to ${weekEnd.toDateString()}`);

    // Check which days we already have data for
    const existingData = await prisma.stepLog.findMany({
      where: {
        userId,
        date: {
          gte: weekStart,
          lte: weekEnd
        }
      },
      select: {
        date: true,
        lastUpdated: true
      }
    });

    const existingDates = new Set(
      existingData.map(d => d.date.toISOString().split('T')[0])
    );

    // Determine which dates need syncing
    const datesToSync = [];
    const currentDate = new Date(weekStart);

    while (currentDate <= weekEnd && currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];

      // Sync if:
      // 1. We don't have data for this date, OR
      // 2. It's today and data is older than 1 hour
      const existingRecord = existingData.find(d =>
        d.date.toISOString().split('T')[0] === dateStr
      );

      const shouldSync = !existingDates.has(dateStr) ||
        (dateStr === today.toISOString().split('T')[0] &&
         existingRecord &&
         (Date.now() - existingRecord.lastUpdated.getTime()) > (60 * 60 * 1000));

      if (shouldSync) {
        datesToSync.push(new Date(currentDate));
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`Dates to sync: ${datesToSync.length}`);
    if (datesToSync.length > 0) {
      console.log(`Syncing dates: ${datesToSync.map(d => d.toDateString()).join(', ')}`);
    }

    let syncedCount = 0;
    let errorCount = 0;

    // Sync each missing/stale date
    for (const dateToSync of datesToSync) {
      const endOfDay = new Date(dateToSync);
      endOfDay.setHours(23, 59, 59, 999);

      try {
        console.log(`📅 Syncing ${dateToSync.toDateString()}...`);
        await fitbitService.syncStepsData(userId, dateToSync, endOfDay);
        syncedCount++;
        console.log(`✅ Successfully synced ${dateToSync.toDateString()}`);

        // Small delay between API calls to respect rate limits
        if (datesToSync.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ Failed to sync ${dateToSync.toDateString()}:`, error);
        errorCount++;
      }
    }

    // Fetch the complete week data from database, handling duplicates by prioritizing FITBIT data
    const rawWeeklyData = await prisma.stepLog.findMany({
      where: {
        userId,
        date: {
          gte: weekStart,
          lte: weekEnd
        }
      },
      orderBy: [
        { date: 'asc' },
        { dataSource: 'desc' } // Prioritize FITBIT over MANUAL/GOOGLE_FIT
      ],
      select: {
        date: true,
        actualSteps: true,
        targetSteps: true,
        isCompleted: true,
        dataSource: true,
        lastUpdated: true
      }
    });

    // Remove duplicates by keeping only the first record for each date (highest priority dataSource)
    const seenDates = new Set();
    const weeklyData = rawWeeklyData.filter(record => {
      const dateStr = record.date.toISOString().split('T')[0];
      if (seenDates.has(dateStr)) {
        return false;
      }
      seenDates.add(dateStr);
      return true;
    });

    // Calculate week statistics
    const totalSteps = weeklyData.reduce((sum, day) => sum + day.actualSteps, 0);
    const totalTarget = weeklyData.reduce((sum, day) => sum + day.targetSteps, 0);
    const completedDays = weeklyData.filter(day => day.isCompleted).length;
    const averageSteps = weeklyData.length > 0 ? Math.round(totalSteps / weeklyData.length) : 0;
    const weekCompletionPercentage = totalTarget > 0 ? Math.round((totalSteps / totalTarget) * 100) : 0;

    console.log(`\n=== WEEKLY SYNC RESULTS ===`);
    console.log(`Synced: ${syncedCount} days`);
    console.log(`Errors: ${errorCount} days`);
    console.log(`Total steps this week: ${totalSteps.toLocaleString()}`);
    console.log(`Average daily steps: ${averageSteps.toLocaleString()}`);
    console.log(`Goals completed: ${completedDays}/7 days`);

    return NextResponse.json({
      success: true,
      weeklyData: weeklyData.map(day => ({
        date: day.date.toISOString(),
        actualSteps: day.actualSteps,
        targetSteps: day.targetSteps,
        isCompleted: day.isCompleted,
        completionPercentage: day.targetSteps > 0 ? Math.round((day.actualSteps / day.targetSteps) * 100) : 0,
        dataSource: day.dataSource,
        lastUpdated: day.lastUpdated.toISOString()
      })),
      weekStats: {
        totalSteps,
        totalTarget,
        completedDays,
        averageSteps,
        weekCompletionPercentage,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString()
      },
      syncResults: {
        syncedCount,
        errorCount,
        totalDatesToSync: datesToSync.length
      }
    });

  } catch (error) {
    console.error("Error in weekly Fitbit sync:", error);
    return NextResponse.json(
      {
        error: "Failed to sync weekly Fitbit data",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}