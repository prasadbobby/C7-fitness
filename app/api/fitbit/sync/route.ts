import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { fitbitService } from "@/services/fitbitService";

export const dynamic = 'force-dynamic';

// POST - Sync Fitbit data
export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { startDate, endDate, days } = body;

    let start: Date;
    let end: Date;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // Default to current day and last few days if no dates provided
      const daysToSync = days || 3; // Reduced default to 3 days for faster sync

      // Always include today (current date in UTC to match dashboard)
      const today = new Date();

      // End: End of today (UTC)
      end = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999));

      // Start: Beginning of (daysToSync) days ago (UTC)
      start = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() - daysToSync, 0, 0, 0, 0));
    }

    console.log(`\n=== FITBIT SYNC REQUEST ===`);
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

    // Sync steps and activity data
    await fitbitService.syncStepsData(userId, start, end);

    console.log(`Fitbit sync completed for user: ${userId}`);

    return NextResponse.json({
      success: true,
      message: "Fitbit data synced successfully",
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    });

  } catch (error) {
    console.error("Error syncing Fitbit data:", error);
    return NextResponse.json(
      {
        error: "Failed to sync Fitbit data",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET - Get sync status and trigger auto-sync
export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const autoSync = searchParams.get('autoSync') === 'true';

    const connectionStatus = await fitbitService.getConnectionStatus(userId);

    if (!connectionStatus.isConnected) {
      return NextResponse.json({
        connected: false,
        message: "No active Fitbit connection"
      });
    }

    if (autoSync) {
      // Auto-sync today only for real-time data
      const today = new Date();

      // Use UTC timezone to match dashboard
      const end = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999));
      const start = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0));

      try {
        await fitbitService.syncStepsData(userId, start, end);
        console.log(`✅ Auto-synced current day: ${start.toDateString()}`);
      } catch (error) {
        console.error("Auto-sync failed:", error);
      }
    }

    return NextResponse.json({
      connected: true,
      lastSync: connectionStatus.lastSyncAt,
      message: autoSync ? "Auto-sync completed" : "Connection active"
    });

  } catch (error) {
    console.error("Error in Fitbit sync GET:", error);
    return NextResponse.json(
      { error: "Failed to check sync status" },
      { status: 500 }
    );
  }
}