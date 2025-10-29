import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { requireSuperAdmin } from "@/utils/adminAuth";
import { PaymentMethod } from "@prisma/client";

export const dynamic = 'force-dynamic';

// PUT - Update an existing payment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; paymentId: string } }
) {
  try {
    await requireSuperAdmin();

    const { id: userId, paymentId } = params;
    const body = await request.json();

    const {
      amount,
      paymentMethod,
      paymentDate,
      transactionId,
      notes
    } = body;

    // Validate required fields
    if (!amount || !paymentMethod || !paymentDate) {
      return NextResponse.json(
        { error: "Amount, payment method, and payment date are required" },
        { status: 400 }
      );
    }

    // Validate payment method
    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    // Get current user info and payment log
    const userInfo = await prisma.userInfo.findUnique({
      where: { id: userId },
      select: {
        id: true,
        discountedPrice: true,
        totalAmountPaid: true,
      },
    });

    if (!userInfo) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the existing payment log
    const existingPaymentLog = await prisma.paymentLog.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        amount: true,
        userInfoId: true,
      },
    });

    if (!existingPaymentLog) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Verify the payment belongs to this user
    if (existingPaymentLog.userInfoId !== userId) {
      return NextResponse.json({ error: "Payment does not belong to this user" }, { status: 400 });
    }

    // Calculate new totals
    const currentPaid = userInfo.totalAmountPaid || 0;
    const oldPaymentAmount = existingPaymentLog.amount;
    const newPaymentAmount = parseFloat(amount);

    // Adjust total paid amount: subtract old payment, add new payment
    const newTotalPaid = currentPaid - oldPaymentAmount + newPaymentAmount;
    const finalPrice = userInfo.discountedPrice || 0;
    const newRemainingAmount = Math.max(0, finalPrice - newTotalPaid);

    // Update payment log and user info in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update payment log
      const updatedPaymentLog = await tx.paymentLog.update({
        where: { id: paymentId },
        data: {
          amount: newPaymentAmount,
          paymentDate: new Date(paymentDate),
          paymentMethod: paymentMethod as PaymentMethod,
          transactionId: transactionId?.trim() || null,
          notes: notes?.trim() || null,
        },
        select: {
          id: true,
          amount: true,
          paymentDate: true,
          paymentMethod: true,
          transactionId: true,
          notes: true,
          recordedBy: true,
          createdAt: true,
        },
      });

      // Update user info
      const updatedUserInfo = await tx.userInfo.update({
        where: { id: userId },
        data: {
          totalAmountPaid: newTotalPaid,
          remainingAmount: newRemainingAmount,
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

      return { updatedPaymentLog, updatedUserInfo };
    });

    return NextResponse.json({
      success: true,
      message: "Payment updated successfully",
      paymentInfo: result.updatedUserInfo,
      updatedPayment: result.updatedPaymentLog,
    });

  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json(
      { error: "Failed to update payment", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a payment (optional feature for future)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; paymentId: string } }
) {
  try {
    await requireSuperAdmin();

    const { id: userId, paymentId } = params;

    // Get current user info and payment log
    const userInfo = await prisma.userInfo.findUnique({
      where: { id: userId },
      select: {
        id: true,
        discountedPrice: true,
        totalAmountPaid: true,
      },
    });

    if (!userInfo) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the existing payment log
    const existingPaymentLog = await prisma.paymentLog.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        amount: true,
        userInfoId: true,
      },
    });

    if (!existingPaymentLog) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Verify the payment belongs to this user
    if (existingPaymentLog.userInfoId !== userId) {
      return NextResponse.json({ error: "Payment does not belong to this user" }, { status: 400 });
    }

    // Calculate new totals after removing this payment
    const currentPaid = userInfo.totalAmountPaid || 0;
    const paymentAmount = existingPaymentLog.amount;
    const newTotalPaid = currentPaid - paymentAmount;
    const finalPrice = userInfo.discountedPrice || 0;
    const newRemainingAmount = Math.max(0, finalPrice - newTotalPaid);

    // Delete payment log and update user info in transaction
    const updatedUserInfo = await prisma.$transaction(async (tx) => {
      // Delete payment log
      await tx.paymentLog.delete({
        where: { id: paymentId },
      });

      // Update user info
      return await tx.userInfo.update({
        where: { id: userId },
        data: {
          totalAmountPaid: newTotalPaid,
          remainingAmount: newRemainingAmount,
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
    });

    return NextResponse.json({
      success: true,
      message: "Payment deleted successfully",
      paymentInfo: updatedUserInfo,
    });

  } catch (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json(
      { error: "Failed to delete payment", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}