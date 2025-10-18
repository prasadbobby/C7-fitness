import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";
import { clerkClient } from "@clerk/nextjs";

export const dynamic = 'force-dynamic';

// GET payment information and history for current user
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's database record
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId },
      select: {
        id: true,
        packagePrice: true,
        discountedPrice: true,
        totalAmountPaid: true,
        remainingAmount: true,
        nextPaymentDue: true,
        paymentNotes: true,
        paymentLogs: {
          orderBy: { paymentDate: 'desc' },
          select: {
            id: true,
            amount: true,
            paymentDate: true,
            paymentMethod: true,
            transactionId: true,
            notes: true,
            createdAt: true,
          },
        },
      },
    });

    if (!userInfo) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // Get user names from Clerk for each recordedBy user ID
    const paymentLogsWithNames = await Promise.all(
      (userInfo.paymentLogs || []).map(async (log) => {
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
      paymentInfo: {
        packagePrice: userInfo.packagePrice,
        discountedPrice: userInfo.discountedPrice,
        totalAmountPaid: userInfo.totalAmountPaid,
        remainingAmount: userInfo.remainingAmount,
        nextPaymentDue: userInfo.nextPaymentDue,
        paymentNotes: userInfo.paymentNotes,
      },
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