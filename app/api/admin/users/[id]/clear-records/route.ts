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

    // Clear all user-specific records
    await prisma.$transaction(async (tx) => {
      // Delete user measurements
      await tx.measurement.deleteMany({
        where: { userInfoId: id }
      });

      // Delete workout logs
      await tx.workoutLog.deleteMany({
        where: { userInfoId: id }
      });

      // Delete training progressions
      await tx.trainingProgression.deleteMany({
        where: { userInfoId: id }
      });

      // Delete assignments
      await tx.assignment.deleteMany({
        where: { userInfoId: id }
      });

      // Delete payment logs for this user
      await tx.paymentLog.deleteMany({
        where: { userInfoId: id }
      });

      // Reset user's membership and payment information
      await tx.userInfo.update({
        where: { id },
        data: {
          // Membership fields
          membershipStartDate: null,
          membershipEndDate: null,
          membershipDuration: null,
          membershipStatus: 'INACTIVE',

          // Payment fields
          packagePrice: null,
          discountedPrice: null,
          totalAmountPaid: 0,
          remainingAmount: 0,
          nextPaymentDue: null,
          paymentNotes: null,

          // Reset any other relevant fields
          height: null,
          weight: null,
          age: null,
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: "All user records cleared successfully"
    });
  } catch (error) {
    console.error("Error clearing user records:", error);
    return NextResponse.json(
      { error: "Failed to clear user records" },
      { status: 500 }
    );
  }
}