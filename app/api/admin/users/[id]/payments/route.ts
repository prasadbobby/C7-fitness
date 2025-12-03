import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { requireSuperAdmin } from "@/utils/adminAuth";
import { PaymentMethod } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs";
import { parseISTDate, istToUTC } from "@/utils/timezone";

export const dynamic = 'force-dynamic';

// GET payment information and history for a user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdmin();

    const { id } = params;

    // Get user info including payment fields
    const userInfo = await prisma.userInfo.findUnique({
      where: { id },
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

    if (!userInfo) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get payment logs
    const paymentLogs = await prisma.paymentLog.findMany({
      where: { userInfoId: id },
      orderBy: { paymentDate: 'desc' },
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

    // Get user names from Clerk for each recordedBy user ID
    const paymentLogsWithNames = await Promise.all(
      paymentLogs.map(async (log) => {
        try {
          const user = await clerkClient.users.getUser(log.recordedBy);
          const recordedByName = user.firstName || user.username || user.emailAddresses[0]?.emailAddress || 'Unknown';

          return {
            ...log,
            recordedByName,
          };
        } catch (error) {
          console.error(`Error fetching user ${log.recordedBy}:`, error);
          return {
            ...log,
            recordedByName: 'Unknown User',
          };
        }
      })
    );

    return NextResponse.json({
      paymentInfo: userInfo,
      paymentLogs: paymentLogsWithNames,
    });

  } catch (error) {
    console.error("Error fetching payment data:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST - Record a new payment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: adminUserId } = await requireSuperAdmin();

    const { id } = params;
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

    // Get current user info
    const userInfo = await prisma.userInfo.findUnique({
      where: { id },
      select: {
        id: true,
        discountedPrice: true,
        totalAmountPaid: true,
      },
    });

    if (!userInfo) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate new totals
    const currentPaid = userInfo.totalAmountPaid || 0;
    const newTotalPaid = currentPaid + parseFloat(amount);
    const finalPrice = userInfo.discountedPrice || 0;
    const newRemainingAmount = Math.max(0, finalPrice - newTotalPaid);

    // Create payment log and update user info in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create payment log
      const newPaymentLog = await tx.paymentLog.create({
        data: {
          userInfoId: id,
          amount: parseFloat(amount),
          paymentDate: istToUTC(parseISTDate(paymentDate.split('T')[0])),
          paymentMethod: paymentMethod as PaymentMethod,
          transactionId: transactionId?.trim() || null,
          notes: notes?.trim() || null,
          recordedBy: adminUserId,
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

      // Update user info and return updated data
      const updatedUserInfo = await tx.userInfo.update({
        where: { id },
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

      return { updatedUserInfo, newPaymentLog };
    });

    // Get admin user name from Clerk
    let recordedByName = 'Unknown Admin';
    try {
      const adminUser = await clerkClient.users.getUser(adminUserId);
      recordedByName = adminUser.firstName || adminUser.username || adminUser.emailAddresses[0]?.emailAddress || 'Unknown Admin';
    } catch (error) {
      console.error(`Error fetching admin user ${adminUserId}:`, error);
    }

    return NextResponse.json({
      success: true,
      message: "Payment recorded successfully",
      paymentInfo: result.updatedUserInfo,
      newPayment: {
        ...result.newPaymentLog,
        recordedByName
      }
    });

  } catch (error) {
    console.error("Error recording payment:", error);
    return NextResponse.json(
      { error: "Failed to record payment", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}