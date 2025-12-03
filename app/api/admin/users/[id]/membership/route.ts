import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { requireAdmin } from "@/utils/adminAuth";
import { auth } from "@clerk/nextjs";
import { MembershipStatus, MembershipChangeType } from "@prisma/client";
import { nowIST, daysRemainingIST, daysBetweenIST, utcToIST, parseISTDate, istToUTC } from "@/utils/timezone";

export const dynamic = 'force-dynamic';

// GET membership information for a user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const { id } = params;

    // Fetch user membership info from database by database ID
    const userInfo = await prisma.userInfo.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        membershipStartDate: true,
        membershipEndDate: true,
        membershipDuration: true,
        membershipStatus: true,
        membershipSetBy: true,
        membershipNotes: true,
        updatedAt: true,
        // New pause/freeze fields
        pausedFrom: true,
        pausedUntil: true,
        totalPausedDays: true,
        pauseReason: true,
        originalEndDate: true,
        // Upcoming extension fields
        upcomingStartDate: true,
        upcomingEndDate: true,
        upcomingDuration: true,
        upcomingNotes: true,
        // Payment information
        packagePrice: true,
        discountedPrice: true,
        totalAmountPaid: true,
        remainingAmount: true,
      },
    });

    if (!userInfo) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Enhanced membership status and days calculation using IST
    const now = nowIST();
    let daysRemaining = 0;
    let isExpired = false;
    let isPaused = userInfo.membershipStatus === 'PAUSED';
    let isUpcoming = false;
    let statusDetails = {};

    if (userInfo.membershipEndDate && userInfo.membershipStartDate) {
      const startDate = new Date(userInfo.membershipStartDate);
      const endDate = new Date(userInfo.membershipEndDate);

      // Check if membership hasn't started yet (using IST)
      if (now < startDate) {
        isUpcoming = true;
        userInfo.membershipStatus = 'UPCOMING';
        const daysToStart = daysRemainingIST(startDate);
        daysRemaining = daysToStart; // Set daysRemaining to days until start for UPCOMING
        statusDetails = {
          daysToStart,
          message: `Starts in ${daysToStart} days`,
        };
      } else {
        daysRemaining = daysRemainingIST(endDate);
        isExpired = daysRemaining <= 0;
      }
    }

    // Handle paused membership calculations using IST
    if (isPaused && userInfo.pausedFrom) {
      const pausedDays = daysBetweenIST(userInfo.pausedFrom, now);
      statusDetails = {
        pausedDays,
        pausedSince: userInfo.pausedFrom.toISOString(),
        pauseReason: userInfo.pauseReason,
        resumeDate: userInfo.pausedUntil?.toISOString(),
        message: userInfo.pausedUntil
          ? `Paused until ${userInfo.pausedUntil.toDateString()}`
          : `Paused ${pausedDays} days ago`,
      };
    }

    // Auto-update membership status if expired (but not if it's paused or upcoming)
    if (isExpired && userInfo.membershipStatus === 'ACTIVE') {
      await prisma.userInfo.update({
        where: { id },
        data: { membershipStatus: 'EXPIRED' },
      });
      userInfo.membershipStatus = 'EXPIRED';
    }

    // Auto-resume paused membership if pausedUntil date has passed (using IST)
    if (isPaused && userInfo.pausedUntil && now > userInfo.pausedUntil) {
      const pausedDays = daysBetweenIST(userInfo.pausedFrom!, userInfo.pausedUntil);
      const totalPausedDays = (userInfo.totalPausedDays || 0) + pausedDays;

      // Extend end date by paused days
      const newEndDate = userInfo.membershipEndDate ? new Date(userInfo.membershipEndDate) : null;
      if (newEndDate) {
        newEndDate.setDate(newEndDate.getDate() + pausedDays);
      }

      await prisma.userInfo.update({
        where: { id },
        data: {
          membershipStatus: 'ACTIVE',
          membershipEndDate: newEndDate,
          totalPausedDays: totalPausedDays,
          pausedFrom: null,
          pausedUntil: null,
          pauseReason: null,
        },
      });

      userInfo.membershipStatus = 'ACTIVE';
      userInfo.membershipEndDate = newEndDate;
      isPaused = false;

      // Recalculate days remaining
      if (newEndDate) {
        const diffTime = newEndDate.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        isExpired = daysRemaining < 0;
      }
    }

    // Auto-activate upcoming membership if start date has passed
    if (isUpcoming && userInfo.membershipStartDate && now >= userInfo.membershipStartDate) {
      await prisma.userInfo.update({
        where: { id },
        data: { membershipStatus: 'ACTIVE' },
      });
      userInfo.membershipStatus = 'ACTIVE';
      isUpcoming = false;

      // Recalculate days remaining
      if (userInfo.membershipEndDate) {
        const diffTime = userInfo.membershipEndDate.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        isExpired = daysRemaining < 0;
      }
    }

    // Check if there's a scheduled extension that should now be applied
    if (userInfo.upcomingStartDate && userInfo.upcomingEndDate) {
      const upcomingStart = new Date(userInfo.upcomingStartDate);
      const nowISTExtended = nowIST(); // Use IST utility for extension date comparison

      // If the extension start date has passed, apply it automatically
      if (nowISTExtended >= upcomingStart) {
        console.log(`Auto-applying scheduled extension for user ${userInfo.userId} - Start date ${upcomingStart.toISOString()} has passed`);

        // Store the original end date for tracking
        const originalEndDate = userInfo.membershipEndDate;

        // Apply the scheduled extension
        await prisma.userInfo.update({
          where: { id },
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
            notes: `Scheduled extension automatically applied on ${nowISTExtended.toISOString()}. ${userInfo.upcomingNotes || ''}`.trim(),
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

        // Recalculate status variables
        if (userInfo.membershipEndDate) {
          const diffTime = userInfo.membershipEndDate.getTime() - now.getTime();
          daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          isExpired = daysRemaining < 0;
        }
        isPaused = false;
        isUpcoming = false;
        statusDetails = `Membership extended and active. ${daysRemaining} days remaining.`;
      }
    }

    // Check if there's an upcoming extension (using IST)
    const hasUpcomingExtension = userInfo.upcomingStartDate && userInfo.upcomingEndDate;
    let upcomingExtensionInfo = null;

    if (hasUpcomingExtension) {
      const upcomingStart = new Date(userInfo.upcomingStartDate!);
      const daysUntilExtension = daysRemainingIST(upcomingStart);

      upcomingExtensionInfo = {
        startDate: userInfo.upcomingStartDate,
        endDate: userInfo.upcomingEndDate,
        duration: userInfo.upcomingDuration,
        daysUntilStart: Math.max(0, daysUntilExtension),
        notes: userInfo.upcomingNotes
      };
    }

    return NextResponse.json({
      membership: {
        ...userInfo,
        daysRemaining: Math.max(0, daysRemaining),
        isExpired,
        isPaused,
        isUpcoming,
        statusDetails,
        upcomingExtension: upcomingExtensionInfo,
        // Helper flags for frontend
        canExtend: userInfo.membershipStartDate && userInfo.membershipEndDate && ['ACTIVE', 'EXPIRED', 'PAUSED', 'UPCOMING', 'CANCELLED', 'SUSPENDED'].includes(userInfo.membershipStatus),
        canPause: userInfo.membershipStatus === 'ACTIVE' && userInfo.membershipStartDate && userInfo.membershipEndDate,
        canResume: userInfo.membershipStatus === 'PAUSED',
        canCancel: ['ACTIVE', 'PAUSED', 'UPCOMING'].includes(userInfo.membershipStatus) && userInfo.membershipStartDate && userInfo.membershipEndDate,
      }
    });

  } catch (error) {
    console.error("Error fetching user membership:", error);
    return NextResponse.json(
      { error: "Failed to fetch user membership", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// PUT/UPDATE membership information for a user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: adminUserId } = auth();
    await requireAdmin();

    const { id } = params;
    const body = await request.json();

    const {
      startDate,
      duration, // duration in days
      status,
      notes
    } = body;

    // Validate required fields
    if (!startDate || !duration) {
      return NextResponse.json(
        { error: "Start date and duration are required" },
        { status: 400 }
      );
    }

    // Get current membership data for change tracking
    const currentMembership = await prisma.userInfo.findUnique({
      where: { id },
      select: {
        id: true,
        membershipStartDate: true,
        membershipEndDate: true,
        membershipDuration: true,
        membershipStatus: true,
        membershipNotes: true,
      },
    });

    if (!currentMembership) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate end date using IST utilities
    const membershipStartDateIST = parseISTDate(startDate.split('T')[0]); // Parse as IST
    const membershipStartDate = istToUTC(membershipStartDateIST); // Convert to UTC for storage
    const membershipEndDate = new Date(membershipStartDate);
    membershipEndDate.setDate(membershipEndDate.getDate() + parseInt(duration));

    // Determine membership status using IST
    const now = nowIST();
    let membershipStatus: MembershipStatus = 'ACTIVE';

    if (status) {
      membershipStatus = status as MembershipStatus;
    } else {
      // Auto-determine status based on dates
      if (membershipStartDate > now) {
        membershipStatus = 'INACTIVE'; // Future start date
      } else if (membershipEndDate < now) {
        membershipStatus = 'EXPIRED'; // Past end date
      } else {
        membershipStatus = 'ACTIVE'; // Currently active
      }
    }

    // Determine change type
    let changeType: MembershipChangeType = 'FULL_UPDATE';
    const isInitialSetup = !currentMembership.membershipStartDate && !currentMembership.membershipEndDate;

    if (isInitialSetup) {
      changeType = 'INITIAL_SETUP';
    } else if (currentMembership.membershipStatus !== membershipStatus) {
      if (membershipStatus === 'ACTIVE' && currentMembership.membershipStatus !== 'ACTIVE') {
        changeType = 'REACTIVATION';
      } else if (membershipStatus === 'SUSPENDED') {
        changeType = 'SUSPENSION';
      } else if (membershipStatus === 'EXPIRED') {
        changeType = 'CANCELLATION';
      } else {
        changeType = 'STATUS_CHANGE';
      }
    } else if (
      currentMembership.membershipStartDate?.getTime() !== membershipStartDate.getTime() ||
      currentMembership.membershipEndDate?.getTime() !== membershipEndDate.getTime()
    ) {
      changeType = 'DATE_CHANGE';
    } else if (currentMembership.membershipDuration !== parseInt(duration)) {
      changeType = 'DURATION_CHANGE';
    }

    // Use transaction to update membership and create log
    const result = await prisma.$transaction(async (tx) => {
      // Update user membership info
      const updatedUser = await tx.userInfo.update({
        where: { id },
        data: {
          membershipStartDate,
          membershipEndDate,
          membershipDuration: parseInt(duration),
          membershipStatus,
          membershipSetBy: adminUserId,
          membershipNotes: notes || null,
        },
        select: {
          id: true,
          userId: true,
          membershipStartDate: true,
          membershipEndDate: true,
          membershipDuration: true,
          membershipStatus: true,
          membershipSetBy: true,
          membershipNotes: true,
          updatedAt: true,
        },
      });

      // Create membership log entry
      await tx.membershipLog.create({
        data: {
          userInfoId: id,
          changeType,
          previousStatus: currentMembership.membershipStatus,
          newStatus: membershipStatus,
          previousStartDate: currentMembership.membershipStartDate,
          newStartDate: membershipStartDate,
          previousEndDate: currentMembership.membershipEndDate,
          newEndDate: membershipEndDate,
          previousDuration: currentMembership.membershipDuration,
          newDuration: parseInt(duration),
          changeDate: new Date(),
          notes: notes || null,
          recordedBy: adminUserId!,
        },
      });

      return updatedUser;
    });

    // Calculate days remaining using IST utilities
    let daysRemaining = 0;
    if (result.membershipEndDate) {
      daysRemaining = daysRemainingIST(result.membershipEndDate);
    }

    return NextResponse.json({
      membership: {
        ...result,
        daysRemaining: Math.max(0, daysRemaining),
        isExpired: daysRemaining < 0,
      }
    });

  } catch (error) {
    console.error("Error updating user membership:", error);
    return NextResponse.json(
      { error: "Failed to update user membership", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}