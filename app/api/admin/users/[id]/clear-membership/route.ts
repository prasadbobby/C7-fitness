import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";
import { requireSuperAdmin } from "@/utils/adminAuth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdmin();

    const { id } = params;

    // Clear membership data and history for this user
    await prisma.$transaction(async (tx) => {
      // Delete all membership logs for this user
      await tx.membershipLog.deleteMany({
        where: { userInfoId: id }
      });

      // Delete all payment logs for this user (as they're related to the membership)
      await tx.paymentLog.deleteMany({
        where: { userInfoId: id }
      });

      // Clear membership data
      await tx.userInfo.update({
        where: { id },
        data: {
          // Reset membership fields
          membershipStartDate: null,
          membershipEndDate: null,
          membershipDuration: null,
          membershipStatus: 'INACTIVE',
          membershipSetBy: null,
          membershipNotes: null,
          // Clear pause fields
          pausedFrom: null,
          pausedUntil: null,
          totalPausedDays: 0,
          pauseReason: null,
          // Clear original end date
          originalEndDate: null,
          // Clear upcoming extension fields
          upcomingStartDate: null,
          upcomingEndDate: null,
          upcomingDuration: null,
          upcomingNotes: null,
          // IMPORTANT: Also clear payment-related fields that create analytics
          packagePrice: null,
          discountedPrice: null,
          totalAmountPaid: 0,
          remainingAmount: 0,
          nextPaymentDue: null,
          paymentNotes: null,
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: "Membership data cleared successfully"
    });
  } catch (error) {
    console.error("Error clearing membership data:", error);
    return NextResponse.json(
      { error: "Failed to clear membership data" },
      { status: 500 }
    );
  }
}