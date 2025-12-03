import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { requireAdmin } from "@/utils/adminAuth";
import { auth } from "@clerk/nextjs";
import { nowIST, createISTDate, daysBetweenIST, parseISTDate, istToUTC, daysRemainingIST } from "@/utils/timezone";

export const dynamic = 'force-dynamic';

// Extension Types
type ExtensionType = 'DAYS' | 'WEEKS' | 'MONTHS';

interface ExtensionRequest {
  extensionType: ExtensionType;
  extensionValue: number; // Number of days/weeks/months to extend
  extensionStartDate?: string; // Custom start date for the extension
  reason?: string;
  maintainCurrentEnd?: boolean; // If true, extend from current end date regardless of status
  isComplementary?: boolean; // If true, no additional payment required (complimentary extension)
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
    const { extensionType, extensionValue, extensionStartDate, reason, maintainCurrentEnd = false, isComplementary = false } = body;

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
        packagePrice: true,
        discountedPrice: true,
        totalAmountPaid: true,
        remainingAmount: true,
        nextPaymentDue: true,
        paymentNotes: true,
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

    // Calculate payment adjustments for extension
    let paymentUpdates: any = {};
    let additionalPaymentRequired = 0;

    if (!isComplementary && currentMembership.discountedPrice && currentMembership.membershipDuration) {
      // Calculate per-day rate based on current package pricing
      const perDayRate = currentMembership.discountedPrice / currentMembership.membershipDuration;
      additionalPaymentRequired = perDayRate * extensionDays;

      // Calculate new total package price for the extended duration
      const newTotalDuration = (currentMembership.membershipDuration || 0) + extensionDays;
      const newDiscountedPrice = perDayRate * newTotalDuration;
      const currentTotalPaid = currentMembership.totalAmountPaid || 0;
      const newRemainingAmount = newDiscountedPrice - currentTotalPaid;

      // Update payment fields
      paymentUpdates = {
        discountedPrice: newDiscountedPrice,
        remainingAmount: newRemainingAmount,
        paymentNotes: `${currentMembership.paymentNotes || ''}\nExtended by ${extensionValue} ${extensionType.toLowerCase()} (${extensionDays} days) - Additional payment required: ₹${additionalPaymentRequired.toFixed(2)}`.trim()
      };
    } else if (isComplementary) {
      paymentUpdates = {
        paymentNotes: `${currentMembership.paymentNotes || ''}\nComplementary extension: ${extensionValue} ${extensionType.toLowerCase()} (${extensionDays} days) - No payment required`.trim()
      };
    }

    // Calculate new dates using custom start date if provided (using IST)
    const now = nowIST();
    let newStartDate: Date;
    let newEndDate: Date;
    let newDuration: number;
    let newStatus = currentMembership.membershipStatus;

    // Determine if we should use custom start date logic
    const shouldUseCustomStartDate = extensionStartDate && extensionStartDate.trim() !== "";

    // Prepare additional update data for upcoming extensions
    let upcomingExtensionData = {};

    // Use custom start date if it's meaningfully different from default continuation
    if (shouldUseCustomStartDate) {
      // Parse the user-provided date as IST and convert to UTC for storage
      const customStartDateIST = parseISTDate(extensionStartDate.split('T')[0]); // Parse as IST date
      const customStartDate = istToUTC(customStartDateIST); // Convert to UTC for database storage
      const currentEndDate = currentMembership.membershipEndDate ? new Date(currentMembership.membershipEndDate) : now;

      // Check if custom start date is after current membership ends
      if (customStartDate > currentEndDate) {
        // Future extension - keep current membership active and schedule extension
        // Don't change current membership dates, just record the upcoming extension
        newStartDate = currentMembership.membershipStartDate || now;
        newEndDate = currentMembership.membershipEndDate ? new Date(currentMembership.membershipEndDate) : now;
        newDuration = currentMembership.membershipDuration || 0;
        newStatus = currentMembership.membershipStatus;

        // Store upcoming extension information in new fields
        const upcomingStartDate = customStartDate; // Already in UTC
        const upcomingEndDate = new Date(customStartDate);
        upcomingEndDate.setDate(upcomingEndDate.getDate() + extensionDays);

        // Add upcoming extension fields to the update
        upcomingExtensionData = {
          upcomingStartDate: upcomingStartDate,
          upcomingEndDate: upcomingEndDate,
          upcomingDuration: extensionDays,
          upcomingNotes: `Extension of ${extensionValue} ${extensionType.toLowerCase()} starting ${upcomingStartDate.toDateString()}`
        };
      } else {
        // Custom start date provided - start extension from the specified date immediately
        newStartDate = customStartDate; // Already in UTC
        newEndDate = new Date(customStartDate);
        newEndDate.setDate(newEndDate.getDate() + extensionDays);

        // Calculate total duration from original start date to new end date
        if (currentMembership.membershipStartDate) {
          const originalStart = new Date(currentMembership.membershipStartDate);
          const timeDiff = newEndDate.getTime() - originalStart.getTime();
          newDuration = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        } else {
          // If no original start date, use extension duration
          newDuration = extensionDays;
          newStartDate = customStartDate; // Use the properly converted UTC date
        }

        // Set status to ACTIVE for custom extensions
        newStatus = 'ACTIVE';

        // Clear any existing upcoming extension data since we're applying it now
        upcomingExtensionData = {
          upcomingStartDate: null,
          upcomingEndDate: null,
          upcomingDuration: null,
          upcomingNotes: null
        };
      }
    } else {
      // Check if membership is expired and should start fresh
      if (['EXPIRED', 'CANCELLED', 'SUSPENDED', 'INACTIVE'].includes(currentMembership.membershipStatus)) {
        // For expired/inactive memberships, start NEW membership the next day after expiry
        if (currentMembership.membershipEndDate) {
          newStartDate = new Date(currentMembership.membershipEndDate);
          newStartDate.setDate(newStartDate.getDate() + 1); // Start the next day after expiry
        } else {
          newStartDate = now; // If no end date, start today
        }
        newEndDate = new Date(newStartDate);
        newEndDate.setDate(newEndDate.getDate() + extensionDays);
        newDuration = extensionDays; // Only the new membership duration, not accumulated
        newStatus = 'ACTIVE';
      } else {
        // For active memberships, extend normally from current end date
        if (currentMembership.membershipEndDate) {
          newStartDate = currentMembership.membershipStartDate || now;
          newEndDate = new Date(currentMembership.membershipEndDate);
          newEndDate.setDate(newEndDate.getDate() + extensionDays);
          newDuration = (currentMembership.membershipDuration || 0) + extensionDays;
        } else {
          // No end date set, extend from today
          newStartDate = currentMembership.membershipStartDate || now;
          newEndDate = new Date(now);
          newEndDate.setDate(newEndDate.getDate() + extensionDays);
          newDuration = extensionDays;
        }
        newStatus = currentMembership.membershipStatus; // Keep current status for active extensions
      }

      // For normal extensions, preserve any existing upcoming extension data
      // Don't include upcomingExtensionData in the update to avoid clearing existing data
    }

    // Update membership with payment calculations
    const updateData = {
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
      // Apply payment updates
      ...paymentUpdates,
      updatedAt: new Date(),
    };

    // Only include upcoming extension data if we actually have some to set
    if (Object.keys(upcomingExtensionData).length > 0) {
      Object.assign(updateData, upcomingExtensionData);
    }

    const updatedMembership = await prisma.userInfo.update({
      where: { id },
      data: updateData,
    });

    // Log the extension - use appropriate change type based on whether it's a new membership or extension
    const isNewMembershipAfterExpiry = ['EXPIRED', 'CANCELLED', 'SUSPENDED', 'INACTIVE'].includes(currentMembership.membershipStatus) && !shouldUseCustomStartDate;

    await prisma.membershipLog.create({
      data: {
        userInfoId: id,
        changeType: isNewMembershipAfterExpiry ? 'RENEWAL' : 'EXTENSION',
        previousStatus: currentMembership.membershipStatus,
        newStatus: newStatus,
        previousStartDate: currentMembership.membershipStartDate,
        newStartDate: newStartDate,
        previousEndDate: currentMembership.membershipEndDate,
        newEndDate: newEndDate,
        previousDuration: currentMembership.membershipDuration,
        newDuration: newDuration,
        changeDate: now,
        notes: reason || (isNewMembershipAfterExpiry ?
          `Renewed membership for ${extensionValue} ${extensionType.toLowerCase()} after previous membership expired` :
          `Extended by ${extensionValue} ${extensionType.toLowerCase()}`),
        recordedBy: adminUserId!,
      },
    });

    // Calculate days remaining using IST utilities
    const daysRemaining = daysRemainingIST(newEndDate);

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
          isComplementary,
          additionalPaymentRequired: isComplementary ? 0 : additionalPaymentRequired,
        },
      },
      paymentCalculation: {
        perDayRate: currentMembership.discountedPrice && currentMembership.membershipDuration ?
          currentMembership.discountedPrice / currentMembership.membershipDuration : 0,
        extensionDays,
        additionalPaymentRequired: isComplementary ? 0 : additionalPaymentRequired,
        isComplementary,
        totalRemainingAmount: updatedMembership.remainingAmount,
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