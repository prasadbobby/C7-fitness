import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { googleFitnessService } from "@/services/googleFitnessService";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { days = 7 } = body;

    // Validate days parameter
    if (days < 1 || days > 30) {
      return NextResponse.json(
        { error: "Days parameter must be between 1 and 30" },
        { status: 400 }
      );
    }

    const result = await googleFitnessService.syncUserData(userId, days);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in fitness sync:", error);
    return NextResponse.json(
      { error: "Failed to sync fitness data" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get sync status and history
    const prisma = (await import("@/prisma/prisma")).default;

    const [connection, recentSyncs] = await Promise.all([
      prisma.googleFitnessConnection.findUnique({
        where: { userId },
        select: {
          isConnected: true,
          lastSyncAt: true,
          syncEnabled: true
        }
      }),
      prisma.fitnessDataSync.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          syncType: true,
          status: true,
          startTime: true,
          endTime: true,
          recordsProcessed: true,
          errorMessage: true
        }
      })
    ]);

    return NextResponse.json({
      isConnected: connection?.isConnected || false,
      lastSyncAt: connection?.lastSyncAt,
      syncEnabled: connection?.syncEnabled || false,
      recentSyncs
    });
  } catch (error) {
    console.error("Error fetching sync status:", error);
    return NextResponse.json(
      { error: "Failed to fetch sync status" },
      { status: 500 }
    );
  }
}