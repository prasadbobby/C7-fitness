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

    // Clear all payment records for this user
    await prisma.$transaction(async (tx) => {
      // Delete all payment logs for this user
      await tx.paymentLog.deleteMany({
        where: { userInfoId: id }
      });

      // Get current user info to calculate remaining amount
      const userInfo = await tx.userInfo.findUnique({
        where: { id },
        select: { discountedPrice: true }
      });

      // Reset payment totals and clear all payment-related data
      await tx.userInfo.update({
        where: { id },
        data: {
          // Clear payment amounts
          totalAmountPaid: 0,
          remainingAmount: 0,
          nextPaymentDue: null,
          // Clear payment pricing (this was missing!)
          packagePrice: null,
          discountedPrice: null,
          paymentNotes: null,
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: "All payment records cleared for user"
    });
  } catch (error) {
    console.error("Error clearing user payment records:", error);
    return NextResponse.json(
      { error: "Failed to clear payment records" },
      { status: 500 }
    );
  }
}