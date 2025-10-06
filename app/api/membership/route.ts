import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { auth } from "@clerk/nextjs";

export const dynamic = 'force-dynamic';

// GET current user's membership information
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user membership info from database
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId },
      select: {
        membershipStartDate: true,
        membershipEndDate: true,
        membershipDuration: true,
        membershipStatus: true,
        membershipNotes: true,
      },
    });

    if (!userInfo) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate days remaining if membership exists
    let daysRemaining = 0;
    let isExpired = false;
    let isActive = false;

    if (userInfo.membershipEndDate && userInfo.membershipStartDate) {
      const now = new Date();
      const startDate = new Date(userInfo.membershipStartDate);
      const endDate = new Date(userInfo.membershipEndDate);

      const diffTime = endDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      isExpired = daysRemaining < 0;
      isActive = now >= startDate && now <= endDate && userInfo.membershipStatus === 'ACTIVE';
    }

    // Auto-update membership status if expired (but don't expose update to user)
    if (isExpired && userInfo.membershipStatus === 'ACTIVE') {
      await prisma.userInfo.update({
        where: { userId },
        data: { membershipStatus: 'EXPIRED' },
      });
      userInfo.membershipStatus = 'EXPIRED';
    }

    return NextResponse.json({
      membership: {
        startDate: userInfo.membershipStartDate,
        endDate: userInfo.membershipEndDate,
        duration: userInfo.membershipDuration,
        status: userInfo.membershipStatus,
        notes: userInfo.membershipNotes,
        daysRemaining: Math.max(0, daysRemaining),
        isExpired,
        isActive,
        hasValidMembership: !!(userInfo.membershipStartDate && userInfo.membershipEndDate),
      }
    });

  } catch (error) {
    console.error("Error fetching user membership:", error);
    return NextResponse.json(
      { error: "Failed to fetch membership information", details: error.message },
      { status: 500 }
    );
  }
}