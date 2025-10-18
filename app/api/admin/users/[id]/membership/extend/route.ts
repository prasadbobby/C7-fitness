import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { requireAdmin } from "@/utils/adminAuth";
import { auth } from "@clerk/nextjs";

export const dynamic = 'force-dynamic';

// Extension Types
type ExtensionType = 'DAYS' | 'WEEKS' | 'MONTHS';

interface ExtensionRequest {
  extensionType: ExtensionType;
  extensionValue: number; // Number of days/weeks/months to extend
  reason?: string;
  maintainCurrentEnd?: boolean; // If true, extend from current end date regardless of status
}

// POST - Extend membership
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const { userId: adminUserId } = auth();
    const { id } = params;

    const body: ExtensionRequest = await request.json();
    const { extensionType, extensionValue, reason, maintainCurrentEnd = false } = body;

    // Validate input
    if (!extensionType || !extensionValue || extensionValue <= 0) {
      return NextResponse.json(
        { error: "Invalid extension parameters" },
        { status: 400 }
      );
    }

    // Get current membership
    const currentMembership = await prisma.userInfo.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        membershipStartDate: true,
        membershipEndDate: true,
        membershipDuration: true,
        membershipStatus: true,
        pausedFrom: true,
        pausedUntil: true,
        totalPausedDays: true,
        originalEndDate: true,
      },
    });

    if (!currentMembership) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate extension in days
    let extensionDays = 0;
    switch (extensionType) {
      case 'DAYS':
        extensionDays = extensionValue;
        break;
      case 'WEEKS':
        extensionDays = extensionValue * 7;
        break;
      case 'MONTHS':
        extensionDays = extensionValue * 30; // Approximate
        break;
    }

    // Calculate new dates based on current membership status
    const now = new Date();
    let newStartDate = currentMembership.membershipStartDate;
    let newEndDate: Date;
    let newDuration: number;
    let newStatus = currentMembership.membershipStatus;

    // Extension logic based on current status
    switch (currentMembership.membershipStatus) {

      case 'ACTIVE': {
        // Extend from current end date
        if (currentMembership.membershipEndDate) {
          newEndDate = new Date(currentMembership.membershipEndDate);
          newEndDate.setDate(newEndDate.getDate() + extensionDays);
          newDuration = (currentMembership.membershipDuration || 0) + extensionDays;
        } else {
          // No end date set, extend from today
          newStartDate = now;
          newEndDate = new Date(now);
          newEndDate.setDate(newEndDate.getDate() + extensionDays);
          newDuration = extensionDays;
        }
        break;
      }

      case 'EXPIRED': {
        if (maintainCurrentEnd && currentMembership.membershipEndDate) {
          // Extend from the expired end date
          newEndDate = new Date(currentMembership.membershipEndDate);
          newEndDate.setDate(newEndDate.getDate() + extensionDays);
          newDuration = (currentMembership.membershipDuration || 0) + extensionDays;
          newStatus = 'ACTIVE'; // Reactivate
        } else {
          // Start fresh from today
          newStartDate = now;
          newEndDate = new Date(now);
          newEndDate.setDate(newEndDate.getDate() + extensionDays);
          newDuration = extensionDays;
          newStatus = 'ACTIVE';
        }
        break;
      }

      case 'PAUSED': {
        // Resume and extend
        if (currentMembership.membershipEndDate) {
          newEndDate = new Date(currentMembership.membershipEndDate);
          newEndDate.setDate(newEndDate.getDate() + extensionDays);
          newDuration = (currentMembership.membershipDuration || 0) + extensionDays;
        } else {
          newStartDate = now;
          newEndDate = new Date(now);
          newEndDate.setDate(newEndDate.getDate() + extensionDays);
          newDuration = extensionDays;
        }
        newStatus = 'ACTIVE';
        break;
      }

      case 'UPCOMING': {
        // Extend the duration of the upcoming membership
        if (currentMembership.membershipEndDate) {
          newEndDate = new Date(currentMembership.membershipEndDate);
          newEndDate.setDate(newEndDate.getDate() + extensionDays);
          newDuration = (currentMembership.membershipDuration || 0) + extensionDays;
        } else {
          return NextResponse.json(
            { error: "Cannot extend upcoming membership without end date" },
            { status: 400 }
          );
        }
        break;
      }

      case 'CANCELLED': {
        // Reactivate with extension
        newStartDate = now;
        newEndDate = new Date(now);
        newEndDate.setDate(newEndDate.getDate() + extensionDays);
        newDuration = extensionDays;
        newStatus = 'ACTIVE';
        break;
      }

      case 'SUSPENDED': {
        // Extend and reactivate
        if (currentMembership.membershipEndDate) {
          newEndDate = new Date(currentMembership.membershipEndDate);
          newEndDate.setDate(newEndDate.getDate() + extensionDays);
          newDuration = (currentMembership.membershipDuration || 0) + extensionDays;
        } else {
          newStartDate = now;
          newEndDate = new Date(now);
          newEndDate.setDate(newEndDate.getDate() + extensionDays);
          newDuration = extensionDays;
        }
        newStatus = 'ACTIVE';
        break;
      }

      case 'INACTIVE': {
        // Create new membership
        newStartDate = now;
        newEndDate = new Date(now);
        newEndDate.setDate(newEndDate.getDate() + extensionDays);
        newDuration = extensionDays;
        newStatus = 'ACTIVE';
        break;
      }

      default: {
        return NextResponse.json(
          { error: `Cannot extend membership with status: ${currentMembership.membershipStatus}` },
          { status: 400 }
        );
      }
    }

    // Update membership
    const updatedMembership = await prisma.userInfo.update({
      where: { id },
      data: {
        membershipStartDate: newStartDate,
        membershipEndDate: newEndDate,
        membershipDuration: newDuration,
        membershipStatus: newStatus,
        membershipSetBy: adminUserId,
        // Clear pause fields if reactivating
        ...(newStatus === 'ACTIVE' && {
          pausedFrom: null,
          pausedUntil: null,
          pauseReason: null,
        }),
        // Set original end date if this is the first time
        originalEndDate: currentMembership.originalEndDate || currentMembership.membershipEndDate,
        updatedAt: new Date(),
      },
    });

    // Log the extension
    await prisma.membershipLog.create({
      data: {
        userInfoId: id,
        changeType: 'EXTENSION',
        previousStatus: currentMembership.membershipStatus,
        newStatus: newStatus,
        previousStartDate: currentMembership.membershipStartDate,
        newStartDate: newStartDate,
        previousEndDate: currentMembership.membershipEndDate,
        newEndDate: newEndDate,
        previousDuration: currentMembership.membershipDuration,
        newDuration: newDuration,
        changeDate: now,
        notes: reason || `Extended by ${extensionValue} ${extensionType.toLowerCase()}`,
        recordedBy: adminUserId!,
      },
    });

    // Calculate days remaining
    const diffTime = newEndDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return NextResponse.json({
      success: true,
      membership: {
        ...updatedMembership,
        daysRemaining: Math.max(0, daysRemaining),
        isExpired: daysRemaining < 0,
        extensionApplied: {
          type: extensionType,
          value: extensionValue,
          days: extensionDays,
        },
      },
    });

  } catch (error) {
    console.error("Error extending membership:", error);
    return NextResponse.json(
      { error: "Failed to extend membership", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}