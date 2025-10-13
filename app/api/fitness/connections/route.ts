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

    const connections = [];

    // Check Google Fitness connection
    const googleFitConnection = await prisma.googleFitnessConnection.findUnique({
      where: { userId }
    });

    if (googleFitConnection) {
      connections.push({
        type: 'GOOGLE_FIT',
        isConnected: googleFitConnection.isConnected,
        lastSyncAt: googleFitConnection.lastSyncAt,
        syncEnabled: googleFitConnection.syncEnabled,
        deviceInfo: {
          name: 'Google Fit',
          type: 'Android' // We could enhance this to detect actual device type
        }
      });
    } else {
      // Always show Google Fit as an option even if not connected
      connections.push({
        type: 'GOOGLE_FIT',
        isConnected: false,
        syncEnabled: false,
        deviceInfo: {
          name: 'Google Fit',
          type: 'Android'
        }
      });
    }

    return NextResponse.json({
      connections,
      totalConnections: connections.filter(c => c.isConnected).length,
      availableTypes: ['GOOGLE_FIT']
    });

  } catch (error) {
    console.error("Error fetching connections:", error);
    return NextResponse.json(
      { error: "Failed to fetch connections" },
      { status: 500 }
    );
  }
}