import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { auth } from "@clerk/nextjs";

export const dynamic = 'force-dynamic';

// GET current user's membership information
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user membership info from database
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId },
      select: {
        id: true,
        membershipStartDate: true,
        membershipEndDate: true,
        membershipDuration: true,
        membershipStatus: true,
        membershipNotes: true,
        upcomingStartDate: true,
        upcomingEndDate: true,
        upcomingDuration: true,
        upcomingNotes: true,
        originalEndDate: true,
      },
    });

    if (!userInfo) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if there's a scheduled extension that should now be applied
    if (userInfo.upcomingStartDate && userInfo.upcomingEndDate) {
      const now = new Date();
      const upcomingStart = new Date(userInfo.upcomingStartDate);
      const nowIST = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // Convert to IST

      // If the extension start date has passed, apply it automatically
      if (nowIST >= upcomingStart) {
        console.log(`Auto-applying scheduled extension for user ${userId} - Start date ${upcomingStart.toISOString()} has passed`);

        // Store the original end date for tracking
        const originalEndDate = userInfo.membershipEndDate;

        // Apply the scheduled extension
        await prisma.userInfo.update({
          where: { userId },
          data: {
            membershipStartDate: userInfo.upcomingStartDate, // Update start date to extension start
            membershipEndDate: userInfo.upcomingEndDate,
            membershipDuration: userInfo.upcomingDuration,
            membershipStatus: 'ACTIVE',
            originalEndDate: originalEndDate, // Store the previous end date
            // Clear upcoming extension fields since it's now applied
            upcomingStartDate: null,
            upcomingEndDate: null,
            upcomingDuration: null,
            upcomingNotes: null
          }
        });

        // Create a membership log entry for this auto-extension application
        await prisma.membershipLog.create({
          data: {
            userInfoId: userInfo.id,
            changeType: 'EXTENSION',
            previousStatus: userInfo.membershipStatus,
            newStatus: 'ACTIVE',
            previousEndDate: originalEndDate,
            newEndDate: userInfo.upcomingEndDate,
            previousDuration: userInfo.membershipDuration,
            newDuration: userInfo.upcomingDuration,
            changeDate: new Date(),
            notes: `Scheduled extension automatically applied on ${nowIST.toISOString()}. ${userInfo.upcomingNotes || ''}`.trim(),
            recordedBy: 'SYSTEM'
          }
        });

        // Update local variables to reflect the changes
        userInfo.membershipStartDate = userInfo.upcomingStartDate; // Update start date too
        userInfo.membershipEndDate = userInfo.upcomingEndDate;
        userInfo.membershipDuration = userInfo.upcomingDuration;
        userInfo.membershipStatus = 'ACTIVE';
        userInfo.originalEndDate = originalEndDate;
        userInfo.upcomingStartDate = null;
        userInfo.upcomingEndDate = null;
        userInfo.upcomingDuration = null;
        userInfo.upcomingNotes = null;
      }
    }

    // Calculate days remaining if membership exists
    let daysRemaining = 0;
    let isExpired = false;
    let isActive = false;

    if (userInfo.membershipEndDate && userInfo.membershipStartDate) {
      const now = new Date();
      const startDate = new Date(userInfo.membershipStartDate);
      const endDate = new Date(userInfo.membershipEndDate);

      const diffTime = endDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      isExpired = daysRemaining < 0;
      isActive = now >= startDate && now <= endDate && userInfo.membershipStatus === 'ACTIVE';
    }

    // Auto-update membership status if expired (but don't expose update to user)
    if (isExpired && userInfo.membershipStatus === 'ACTIVE') {
      await prisma.userInfo.update({
        where: { userId },
        data: { membershipStatus: 'EXPIRED' },
      });
      userInfo.membershipStatus = 'EXPIRED';
    }

    return NextResponse.json({
      membership: {
        startDate: userInfo.membershipStartDate,
        endDate: userInfo.membershipEndDate,
        duration: userInfo.membershipDuration,
        status: userInfo.membershipStatus,
        notes: userInfo.membershipNotes,
        daysRemaining: Math.max(0, daysRemaining),
        isExpired,
        isActive,
        hasValidMembership: !!(userInfo.membershipStartDate && userInfo.membershipEndDate),
      }
    });

  } catch (error) {
    console.error("Error fetching user membership:", error);
    return NextResponse.json(
      { error: "Failed to fetch membership information", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}