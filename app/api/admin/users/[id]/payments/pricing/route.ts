import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { requireSuperAdmin } from "@/utils/adminAuth";

export const dynamic = 'force-dynamic';

// PUT - Update payment pricing for a user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdmin();

    const { id } = params;
    const body = await request.json();

    const {
      packagePrice,
      discountedPrice,
      nextPaymentDue,
      paymentNotes
    } = body;

    // Get current user info to calculate remaining amount
    const userInfo = await prisma.userInfo.findUnique({
      where: { id },
      select: {
        id: true,
        totalAmountPaid: true,
      },
    });

    if (!userInfo) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate remaining amount if discounted price is provided
    const currentPaid = userInfo.totalAmountPaid || 0;
    const finalPrice = discountedPrice ? parseFloat(discountedPrice) : 0;
    const remainingAmount = finalPrice > 0 ? Math.max(0, finalPrice - currentPaid) : null;

    // Update user info
    const updatedUser = await prisma.userInfo.update({
      where: { id },
      data: {
        packagePrice: packagePrice ? parseFloat(packagePrice) : null,
        discountedPrice: discountedPrice ? parseFloat(discountedPrice) : null,
        remainingAmount: remainingAmount,
        nextPaymentDue: nextPaymentDue ? new Date(nextPaymentDue) : null,
        paymentNotes: paymentNotes?.trim() || null,
      },
      select: {
        id: true,
        packagePrice: true,
        discountedPrice: true,
        totalAmountPaid: true,
        remainingAmount: true,
        nextPaymentDue: true,
        paymentNotes: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment pricing updated successfully",
      paymentInfo: updatedUser,
    });

  } catch (error) {
    console.error("Error updating payment pricing:", error);
    return NextResponse.json(
      { error: "Failed to update payment pricing", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}