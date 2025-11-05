import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";
import { requireSuperAdmin } from "@/utils/adminAuth";

export async function DELETE(request: NextRequest) {
  try {
    await requireSuperAdmin();

    // Clear all payment and pricing related data
    await prisma.$transaction(async (tx) => {
      // Delete all payment logs
      await tx.paymentLog.deleteMany({});

      // Reset all user pricing information
      await tx.userInfo.updateMany({
        data: {
          packagePrice: null,
          discountedPrice: null,
          totalAmountPaid: 0,
          remainingAmount: 0,
          nextPaymentDue: null,
          paymentNotes: null
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: "All payment records cleared successfully"
    });
  } catch (error) {
    console.error("Error clearing all payment records:", error);
    return NextResponse.json(
      { error: "Failed to clear payment records" },
      { status: 500 }
    );
  }
}