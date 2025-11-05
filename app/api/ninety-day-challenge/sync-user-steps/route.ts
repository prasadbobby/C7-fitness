import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";
import { fitbitService } from "@/services/fitbitService";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId, date } = await request.json();

    // Check if current user has permission to sync this user's data
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId: user.id },
      select: { role: true }
    });

    const isAdmin = userInfo?.role === 'ADMIN' || userInfo?.role === 'SUPER_ADMIN';
    const isSelfSync = user.id === targetUserId;

    if (!isAdmin && !isSelfSync) {
      return NextResponse.json({ error: "Forbidden - can only sync own data or admin access required" }, { status: 403 });
    }

    // Parse the date and create proper UTC date range
    const [year, month, day] = date.split('-').map(Number);
    const targetDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    console.log(`🔄 Manual sync requested by ${user.id} for user ${targetUserId} on ${date}`);

    // Check if user has Fitbit connected
    const fitbitConnection = await prisma.fitbitConnection.findUnique({
      where: { userId: targetUserId },
      select: { isConnected: true, syncEnabled: true }
    });

    if (!fitbitConnection?.isConnected) {
      return NextResponse.json({
        error: "Fitbit not connected for this user",
        success: false
      }, { status: 400 });
    }

    // Perform the sync for the specific date
    try {
      await fitbitService.syncStepsData(targetUserId, targetDate, endDate);
      console.log(`✅ Successfully synced data for user ${targetUserId} on ${date}`);

      return NextResponse.json({
        success: true,
        message: "Data synced successfully",
        userId: targetUserId,
        date: date,
        syncedBy: user.id
      });

    } catch (syncError) {
      console.error(`❌ Sync failed for user ${targetUserId} on ${date}:`, syncError);

      return NextResponse.json({
        success: false,
        error: syncError instanceof Error ? syncError.message : "Sync failed",
        userId: targetUserId,
        date: date
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Error in manual user sync:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 });
  }
}