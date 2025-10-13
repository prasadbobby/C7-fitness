import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await prisma.googleFitnessConnection.findUnique({
      where: { userId },
      select: {
        id: true,
        isConnected: true,
        lastSyncAt: true,
        syncEnabled: true,
        tokenExpiry: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!connection) {
      return NextResponse.json({
        isConnected: false,
        canConnect: true,
        message: "No Google Fitness connection found"
      });
    }

    const isTokenValid = connection.tokenExpiry > new Date();

    return NextResponse.json({
      isConnected: connection.isConnected && isTokenValid,
      lastSyncAt: connection.lastSyncAt,
      syncEnabled: connection.syncEnabled,
      tokenExpiry: connection.tokenExpiry,
      tokenValid: isTokenValid,
      connectionCreated: connection.createdAt,
      lastUpdated: connection.updatedAt
    });
  } catch (error) {
    console.error("Error fetching connection status:", error);
    return NextResponse.json(
      { error: "Failed to fetch connection status" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = auth();
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

    const connection = await prisma.googleFitnessConnection.findUnique({
      where: { userId }
    });

    if (!connection) {
      return NextResponse.json(
        { error: "No Google Fitness connection found" },
        { status: 404 }
      );
    }

    const updatedConnection = await prisma.googleFitnessConnection.update({
      where: { userId },
      data: {
        syncEnabled,
        updatedAt: new Date()
      },
      select: {
        isConnected: true,
        syncEnabled: true,
        lastSyncAt: true
      }
    });

    return NextResponse.json({
      success: true,
      message: `Sync ${syncEnabled ? 'enabled' : 'disabled'} successfully`,
      connection: updatedConnection
    });
  } catch (error) {
    console.error("Error updating sync settings:", error);
    return NextResponse.json(
      { error: "Failed to update sync settings" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await prisma.googleFitnessConnection.findUnique({
      where: { userId }
    });

    if (!connection) {
      return NextResponse.json(
        { error: "No Google Fitness connection found" },
        { status: 404 }
      );
    }

    // Soft delete - mark as disconnected instead of actually deleting
    await prisma.googleFitnessConnection.update({
      where: { userId },
      data: {
        isConnected: false,
        syncEnabled: false,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: "Google Fitness connection disconnected successfully"
    });
  } catch (error) {
    console.error("Error disconnecting Google Fitness:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Google Fitness" },
      { status: 500 }
    );
  }
}