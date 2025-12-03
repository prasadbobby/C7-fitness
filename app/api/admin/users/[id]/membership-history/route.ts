import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { requireSuperAdmin } from "@/utils/adminAuth";
import { clerkClient } from "@clerk/nextjs";

export const dynamic = 'force-dynamic';

// GET membership history for a user
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdmin();

    const { id } = params;

    // Get user info including current membership details
    const userInfo = await prisma.userInfo.findUnique({
      where: { id },
      select: {
        id: true,
        membershipStartDate: true,
        membershipEndDate: true,
        membershipDuration: true,
        membershipStatus: true,
        membershipSetBy: true,
        membershipNotes: true,
        userId: true,
      },
    });

    if (!userInfo) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch user details from Clerk
    let clerkUser;
    try {
      clerkUser = await clerkClient.users.getUser(userInfo.userId);
    } catch (error) {
      console.error("Error fetching Clerk user:", error);
    }

    // Combine database and Clerk user data
    const enrichedUserInfo = {
      ...userInfo,
      firstName: clerkUser?.firstName,
      lastName: clerkUser?.lastName,
      username: clerkUser?.username,
      email: clerkUser?.emailAddresses?.[0]?.emailAddress,
    };

    // Get membership logs
    const membershipLogs = await prisma.membershipLog.findMany({
      where: { userInfoId: id },
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
    });

    // Get user names from Clerk for each recordedBy user ID
    const membershipLogsWithNames = await Promise.all(
      membershipLogs.map(async (log: any) => {
        // Check if recordedBy is a valid user ID
        if (!log.recordedBy || typeof log.recordedBy !== 'string' || log.recordedBy.trim() === '' || log.recordedBy === 'SYSTEM' || log.recordedBy === 'AUTO_EXTENSION_SCRIPT') {
          return {
            ...log,
            recordedByName: 'System',
          };
        }

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
            recordedByName: 'System',
          };
        }
      })
    );

    return NextResponse.json({
      membershipInfo: enrichedUserInfo,
      membershipLogs: membershipLogsWithNames,
    });

  } catch (error) {
    console.error("Error fetching membership history:", error);
    return NextResponse.json(
      { error: "Failed to fetch membership history", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}