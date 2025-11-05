import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { fitbitService } from "@/services/fitbitService";
import prisma from "@/prisma/prisma";

export const dynamic = 'force-dynamic';

// GET - Get Fitbit connection status
export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connectionStatus = await fitbitService.getConnectionStatus(userId);

    return NextResponse.json(connectionStatus);

  } catch (error) {
    console.error("Error fetching Fitbit connection status:", error);
    return NextResponse.json(
      { error: "Failed to fetch connection status" },
      { status: 500 }
    );
  }
}

// PUT - Update Fitbit sync settings
export async function PUT(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { syncEnabled } = body;

    if (typeof syncEnabled !== 'boolean') {
      return NextResponse.json(
        { error: "syncEnabled must be a boolean" },
        { status: 400 }
      );
    }

    // Update sync settings in database
    await prisma.fitbitConnection.update({
      where: { userId },
      data: {
        syncEnabled,
        updatedAt: new Date()
      }
    });

    const connectionStatus = await fitbitService.getConnectionStatus(userId);

    return NextResponse.json({
      success: true,
      message: `Fitbit sync ${syncEnabled ? 'enabled' : 'disabled'} successfully`,
      connection: connectionStatus
    });

  } catch (error) {
    console.error("Error updating Fitbit sync settings:", error);
    return NextResponse.json(
      { error: "Failed to update sync settings" },
      { status: 500 }
    );
  }
}

// DELETE - Disconnect Fitbit
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await fitbitService.disconnectFitbit(userId);

    return NextResponse.json({
      success: true,
      message: "Fitbit connection disconnected successfully"
    });

  } catch (error) {
    console.error("Error disconnecting Fitbit:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Fitbit" },
      { status: 500 }
    );
  }
}