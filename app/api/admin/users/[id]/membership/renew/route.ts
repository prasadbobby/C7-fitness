import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { requireAdmin } from "@/utils/adminAuth";
import { auth } from "@clerk/nextjs";

export const dynamic = 'force-dynamic';

// Renewal Types
type RenewalType = 'EXPIRED_RENEWAL' | 'EARLY_RENEWAL' | 'UPGRADE_RENEWAL' | 'DOWNGRADE_RENEWAL';

interface RenewalRequest {
  renewalType: RenewalType;
  newDuration: number; // New membership duration in days
  newStartDate?: string; // Optional new start date (defaults to today for expired, or end date for early)
  reason?: string;
  membershipNotes?: string;
}

// POST - Renew membership
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const { userId: adminUserId } = auth();
    const { id } = params;

    const body: RenewalRequest = await request.json();
    const { renewalType, newDuration, newStartDate, reason, membershipNotes } = body;

    // Validate input
    if (!renewalType || !newDuration || newDuration <= 0) {
      return NextResponse.json(
        { error: "Invalid renewal parameters" },
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
        membershipNotes: true,
      },
    });

    if (!currentMembership) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    let renewalStartDate: Date;
    let renewalEndDate: Date;
    let newStatus = 'ACTIVE';

    // Calculate renewal dates based on renewal type
    switch (renewalType) {
      case 'EXPIRED_RENEWAL': {
        // Start fresh from today (or specified date) for expired membership
        renewalStartDate = newStartDate ? new Date(newStartDate) : now;
        renewalEndDate = new Date(renewalStartDate);
        renewalEndDate.setDate(renewalEndDate.getDate() + newDuration);

        if (currentMembership.membershipStatus !== 'EXPIRED' && currentMembership.membershipStatus !== 'CANCELLED') {
          return NextResponse.json(
            { error: "Expired renewal can only be applied to EXPIRED or CANCELLED memberships" },
            { status: 400 }
          );
        }
        break;
      }

      case 'EARLY_RENEWAL': {
        // Start from current end date (seamless renewal)
        if (!currentMembership.membershipEndDate) {
          return NextResponse.json(
            { error: "Cannot perform early renewal without existing end date" },
            { status: 400 }
          );
        }

        renewalStartDate = new Date(currentMembership.membershipEndDate);
        renewalEndDate = new Date(renewalStartDate);
        renewalEndDate.setDate(renewalEndDate.getDate() + newDuration);

        if (currentMembership.membershipStatus !== 'ACTIVE') {
          return NextResponse.json(
            { error: "Early renewal can only be applied to ACTIVE memberships" },
            { status: 400 }
          );
        }
        break;
      }

      case 'UPGRADE_RENEWAL':
      case 'DOWNGRADE_RENEWAL': {
        // For upgrades/downgrades, start from current end date or today if expired
        if (currentMembership.membershipEndDate && new Date(currentMembership.membershipEndDate) > now) {
          // Current membership is still active, start from end date
          renewalStartDate = new Date(currentMembership.membershipEndDate);
        } else {
          // Current membership is expired, start from today
          renewalStartDate = now;
        }

        renewalEndDate = new Date(renewalStartDate);
        renewalEndDate.setDate(renewalEndDate.getDate() + newDuration);
        break;
      }

      default: {
        return NextResponse.json(
          { error: `Invalid renewal type: ${renewalType}` },
          { status: 400 }
        );
      }
    }

    // Update membership with renewal
    const updatedMembership = await prisma.userInfo.update({
      where: { id },
      data: {
        membershipStartDate: renewalStartDate,
        membershipEndDate: renewalEndDate,
        membershipDuration: newDuration,
        membershipStatus: newStatus,
        membershipSetBy: adminUserId,
        membershipNotes: membershipNotes || null,
        // Clear pause fields on renewal
        pausedFrom: null,
        pausedUntil: null,
        pauseReason: null,
        totalPausedDays: null,
        // Store original end date if this is first renewal
        originalEndDate: currentMembership.membershipEndDate,
        updatedAt: new Date(),
      },
    });

    // Log the renewal
    await prisma.membershipLog.create({
      data: {
        userInfoId: id,
        changeType: 'RENEWAL',
        previousStatus: currentMembership.membershipStatus,
        newStatus: newStatus,
        previousStartDate: currentMembership.membershipStartDate,
        newStartDate: renewalStartDate,
        previousEndDate: currentMembership.membershipEndDate,
        newEndDate: renewalEndDate,
        previousDuration: currentMembership.membershipDuration,
        newDuration: newDuration,
        changeDate: now,
        notes: reason || `${renewalType.replace('_', ' ').toLowerCase()} - ${newDuration} days`,
        recordedBy: adminUserId!,
      },
    });

    // Calculate days remaining
    const diffTime = renewalEndDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return NextResponse.json({
      success: true,
      membership: {
        ...updatedMembership,
        daysRemaining: Math.max(0, daysRemaining),
        isExpired: daysRemaining < 0,
        renewalApplied: {
          type: renewalType,
          duration: newDuration,
          previousDuration: currentMembership.membershipDuration,
        },
      },
    });

  } catch (error) {
    console.error("Error renewing membership:", error);
    return NextResponse.json(
      { error: "Failed to renew membership", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}