import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { requireAdmin } from "@/utils/adminAuth";
import { auth } from "@clerk/nextjs";
import { nowIST, parseISTDate, istToUTC, daysRemainingIST, daysBetweenIST } from "@/utils/timezone";

export const dynamic = 'force-dynamic';

interface PauseRequest {
  action: 'PAUSE' | 'RESUME';
  pauseUntil?: string; // Optional resume date (ISO string)
  reason?: string;
  adjustEndDate?: boolean; // If true, extend end date by paused days when resuming
}

// POST - Pause or Resume membership
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const { userId: adminUserId } = auth();
    const { id } = params;

    const body: PauseRequest = await request.json();
    const { action, pauseUntil, reason, adjustEndDate = true } = body;

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
        pauseReason: true,
        originalEndDate: true,
      },
    });

    if (!currentMembership) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = nowIST();

    if (action === 'PAUSE') {
      // Can only pause ACTIVE memberships
      if (currentMembership.membershipStatus !== 'ACTIVE') {
        return NextResponse.json(
          { error: "Can only pause ACTIVE memberships" },
          { status: 400 }
        );
      }

      if (currentMembership.pausedFrom) {
        return NextResponse.json(
          { error: "Membership is already paused" },
          { status: 400 }
        );
      }

      const pauseUntilDate = pauseUntil ? istToUTC(parseISTDate(pauseUntil.split('T')[0])) : null;

      // Validate pause until date (compare UTC times)
      if (pauseUntilDate && pauseUntilDate <= istToUTC(now)) {
        return NextResponse.json(
          { error: "Pause until date must be in the future" },
          { status: 400 }
        );
      }

      // Update membership to PAUSED status
      const updatedMembership = await prisma.userInfo.update({
        where: { id },
        data: {
          membershipStatus: 'PAUSED',
          pausedFrom: istToUTC(now),
          pausedUntil: pauseUntilDate,
          pauseReason: reason,
          membershipSetBy: adminUserId,
          updatedAt: istToUTC(now),
        },
      });

      // Log the pause
      await prisma.membershipLog.create({
        data: {
          userInfoId: id,
          changeType: 'PAUSE',
          previousStatus: 'ACTIVE',
          newStatus: 'PAUSED',
          previousStartDate: currentMembership.membershipStartDate,
          newStartDate: currentMembership.membershipStartDate,
          previousEndDate: currentMembership.membershipEndDate,
          newEndDate: currentMembership.membershipEndDate,
          previousDuration: currentMembership.membershipDuration,
          newDuration: currentMembership.membershipDuration,
          changeDate: istToUTC(now),
          notes: reason || (pauseUntilDate
            ? `Paused until ${pauseUntilDate.toDateString()}`
            : 'Paused indefinitely'),
          recordedBy: adminUserId!,
        },
      });

      return NextResponse.json({
        success: true,
        membership: updatedMembership,
        message: pauseUntilDate
          ? `Membership paused until ${pauseUntilDate.toDateString()}`
          : 'Membership paused indefinitely',
      });

    } else if (action === 'RESUME') {
      // Can only resume PAUSED memberships
      if (currentMembership.membershipStatus !== 'PAUSED') {
        return NextResponse.json(
          { error: "Can only resume PAUSED memberships" },
          { status: 400 }
        );
      }

      if (!currentMembership.pausedFrom) {
        return NextResponse.json(
          { error: "Membership is not currently paused" },
          { status: 400 }
        );
      }

      // Calculate how many days the membership was paused using IST utilities
      const pausedDays = daysBetweenIST(currentMembership.pausedFrom, istToUTC(now));
      const totalPausedDays = (currentMembership.totalPausedDays || 0) + pausedDays;

      let newEndDate = currentMembership.membershipEndDate;

      // If adjustEndDate is true, extend the end date by the number of paused days
      if (adjustEndDate && currentMembership.membershipEndDate) {
        newEndDate = new Date(currentMembership.membershipEndDate);
        newEndDate.setDate(newEndDate.getDate() + pausedDays);
      }

      // Update membership to ACTIVE status
      const updatedMembership = await prisma.userInfo.update({
        where: { id },
        data: {
          membershipStatus: 'ACTIVE',
          membershipEndDate: newEndDate,
          totalPausedDays: totalPausedDays,
          pausedFrom: null,
          pausedUntil: null,
          pauseReason: null,
          membershipSetBy: adminUserId,
          updatedAt: istToUTC(now),
        },
      });

      // Log the resume
      await prisma.membershipLog.create({
        data: {
          userInfoId: id,
          changeType: 'RESUME',
          previousStatus: 'PAUSED',
          newStatus: 'ACTIVE',
          previousStartDate: currentMembership.membershipStartDate,
          newStartDate: currentMembership.membershipStartDate,
          previousEndDate: currentMembership.membershipEndDate,
          newEndDate: newEndDate,
          previousDuration: currentMembership.membershipDuration,
          newDuration: currentMembership.membershipDuration,
          changeDate: istToUTC(now),
          notes: adjustEndDate
            ? `Resumed after ${pausedDays} days pause. End date extended by ${pausedDays} days.`
            : `Resumed after ${pausedDays} days pause. End date unchanged.`,
          recordedBy: adminUserId!,
        },
      });

      // Calculate days remaining using IST utilities
      const daysRemaining = newEndDate ? daysRemainingIST(newEndDate) : 0;

      return NextResponse.json({
        success: true,
        membership: {
          ...updatedMembership,
          daysRemaining: Math.max(0, daysRemaining),
          isExpired: daysRemaining < 0,
        },
        pauseDetails: {
          pausedDays,
          totalPausedDays,
          endDateAdjusted: adjustEndDate,
          newEndDate: newEndDate?.toISOString(),
        },
        message: adjustEndDate
          ? `Membership resumed. End date extended by ${pausedDays} days.`
          : `Membership resumed. ${pausedDays} days were paused.`,
      });

    } else {
      return NextResponse.json(
        { error: "Invalid action. Must be 'PAUSE' or 'RESUME'" },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("Error pausing/resuming membership:", error);
    return NextResponse.json(
      { error: "Failed to pause/resume membership", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}