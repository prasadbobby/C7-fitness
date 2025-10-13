import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { googleFitnessService } from "@/services/googleFitnessService";
import prisma from "@/prisma/prisma";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has Google Fitness connected
    const connection = await prisma.googleFitnessConnection.findUnique({
      where: { userId, isConnected: true }
    });

    if (!connection) {
      return NextResponse.json({
        success: false,
        error: "Google Fitness not connected"
      }, { status: 400 });
    }

    // Auto-sync last 3 days (to catch any missed data)
    const result = await googleFitnessService.syncUserData(userId, 3);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in auto-sync:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to sync fitness data"
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check connection status
    const connection = await prisma.googleFitnessConnection.findUnique({
      where: { userId }
    });

    const lastSync = await prisma.fitnessDataSync.findFirst({
      where: { userId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      isConnected: connection?.isConnected || false,
      lastSyncAt: connection?.lastSyncAt,
      lastSuccessfulSync: lastSync?.createdAt,
      syncEnabled: connection?.syncEnabled || false
    });
  } catch (error) {
    console.error("Error checking auto-sync status:", error);
    return NextResponse.json({ error: "Failed to check sync status" }, { status: 500 });
  }
}