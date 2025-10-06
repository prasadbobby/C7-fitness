import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { requireAdmin } from "@/utils/adminAuth";
import { auth } from "@clerk/nextjs";
import { MembershipStatus } from "@prisma/client";

export const dynamic = 'force-dynamic';

// GET membership information for a user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const { id } = params;

    // Fetch user membership info from database by database ID
    const userInfo = await prisma.userInfo.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        membershipStartDate: true,
        membershipEndDate: true,
        membershipDuration: true,
        membershipStatus: true,
        membershipSetBy: true,
        membershipNotes: true,
        updatedAt: true,
      },
    });

    if (!userInfo) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate days remaining if membership is active
    let daysRemaining = 0;
    let isExpired = false;

    if (userInfo.membershipEndDate) {
      const now = new Date();
      const endDate = new Date(userInfo.membershipEndDate);
      const diffTime = endDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      isExpired = daysRemaining < 0;
    }

    // Auto-update membership status if expired
    if (isExpired && userInfo.membershipStatus === 'ACTIVE') {
      await prisma.userInfo.update({
        where: { id },
        data: { membershipStatus: 'EXPIRED' },
      });
      userInfo.membershipStatus = 'EXPIRED';
    }

    return NextResponse.json({
      membership: {
        ...userInfo,
        daysRemaining: Math.max(0, daysRemaining),
        isExpired,
      }
    });

  } catch (error) {
    console.error("Error fetching user membership:", error);
    return NextResponse.json(
      { error: "Failed to fetch user membership", details: error.message },
      { status: 500 }
    );
  }
}

// PUT/UPDATE membership information for a user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: adminUserId } = auth();
    await requireAdmin();

    const { id } = params;
    const body = await request.json();

    const {
      startDate,
      duration, // duration in days
      status,
      notes
    } = body;

    // Validate required fields
    if (!startDate || !duration) {
      return NextResponse.json(
        { error: "Start date and duration are required" },
        { status: 400 }
      );
    }

    // Calculate end date
    const membershipStartDate = new Date(startDate);
    const membershipEndDate = new Date(membershipStartDate);
    membershipEndDate.setDate(membershipEndDate.getDate() + parseInt(duration));

    // Determine membership status
    const now = new Date();
    let membershipStatus: MembershipStatus = 'ACTIVE';

    if (status) {
      membershipStatus = status as MembershipStatus;
    } else {
      // Auto-determine status based on dates
      if (membershipStartDate > now) {
        membershipStatus = 'INACTIVE'; // Future start date
      } else if (membershipEndDate < now) {
        membershipStatus = 'EXPIRED'; // Past end date
      } else {
        membershipStatus = 'ACTIVE'; // Currently active
      }
    }

    // Update user membership info
    const updatedUser = await prisma.userInfo.update({
      where: { id },
      data: {
        membershipStartDate,
        membershipEndDate,
        membershipDuration: parseInt(duration),
        membershipStatus,
        membershipSetBy: adminUserId,
        membershipNotes: notes || null,
      },
      select: {
        id: true,
        userId: true,
        membershipStartDate: true,
        membershipEndDate: true,
        membershipDuration: true,
        membershipStatus: true,
        membershipSetBy: true,
        membershipNotes: true,
        updatedAt: true,
      },
    });

    // Calculate days remaining
    let daysRemaining = 0;
    if (updatedUser.membershipEndDate) {
      const diffTime = updatedUser.membershipEndDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return NextResponse.json({
      membership: {
        ...updatedUser,
        daysRemaining: Math.max(0, daysRemaining),
        isExpired: daysRemaining < 0,
      }
    });

  } catch (error) {
    console.error("Error updating user membership:", error);
    return NextResponse.json(
      { error: "Failed to update user membership", details: error.message },
      { status: 500 }
    );
  }
}