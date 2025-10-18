import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";
import { clerkClient } from "@clerk/nextjs";

export const dynamic = 'force-dynamic';

// GET membership information and history for current user
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's database record
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId },
      select: {
        id: true,
        membershipStartDate: true,
        membershipEndDate: true,
        membershipDuration: true,
        membershipStatus: true,
        membershipSetBy: true,
        membershipNotes: true,
        membershipLogs: {
          orderBy: { changeDate: 'desc' },
          select: {
            id: true,
            changeType: true,
            previousStatus: true,
            newStatus: true,
            previousStartDate: true,
            newStartDate: true,
            previousEndDate: true,
            newEndDate: true,
            previousDuration: true,
            newDuration: true,
            changeDate: true,
            notes: true,
            recordedBy: true,
            createdAt: true,
          },
        },
      },
    });

    if (!userInfo) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // Get user names from Clerk for each recordedBy user ID
    const membershipLogsWithNames = await Promise.all(
      (userInfo.membershipLogs || []).map(async (log) => {
        try {
          const user = await clerkClient.users.getUser(log.recordedBy);
          const recordedByName = user.firstName || user.username || user.emailAddresses[0]?.emailAddress || 'Unknown';

          return {
            ...log,
            recordedByName,
          };
        } catch (error) {
          console.error(`Error fetching user ${log.recordedBy}:`, error);
          return {
            ...log,
            recordedByName: 'Unknown User',
          };
        }
      })
    );

    return NextResponse.json({
      membershipInfo: {
        membershipStartDate: userInfo.membershipStartDate,
        membershipEndDate: userInfo.membershipEndDate,
        membershipDuration: userInfo.membershipDuration,
        membershipStatus: userInfo.membershipStatus,
        membershipNotes: userInfo.membershipNotes,
      },
      membershipLogs: membershipLogsWithNames,
    });

  } catch (error) {
    console.error("Error fetching membership data:", error);
    return NextResponse.json(
      { error: "Failed to fetch membership data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}