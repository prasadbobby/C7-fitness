import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { requireAdmin } from "@/utils/adminAuth";
import { clerkClient } from "@clerk/nextjs";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const active = searchParams.get("active");

    const where: any = {};
    if (userId) where.userId = userId;
    if (active === "true") where.isActive = true;

    const stepGoals = await prisma.stepGoal.findMany({
      where,
      include: {
        stepLogs: {
          orderBy: { date: "desc" },
          take: 7, // Last 7 days
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get user info for each goal with Clerk data
    const goalsWithUserInfo = await Promise.all(
      stepGoals.map(async (goal) => {
        const userInfo = await prisma.userInfo.findUnique({
          where: { userId: goal.userId },
          select: {
            userId: true,
            role: true,
          },
        });

        // Fetch Clerk user data for usernames and emails
        let clerkUserData = null;
        try {
          const clerkUser = await clerkClient.users.getUser(goal.userId);
          clerkUserData = {
            userId: goal.userId,
            username: clerkUser.username || clerkUser.firstName || clerkUser.emailAddresses[0]?.emailAddress || goal.userId,
            email: clerkUser.emailAddresses[0]?.emailAddress,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl,
            role: userInfo?.role || "USER",
          };
        } catch (error) {
          // If Clerk user not found, return with just userId
          clerkUserData = {
            userId: goal.userId,
            username: goal.userId,
            email: null,
            firstName: null,
            lastName: null,
            imageUrl: null,
            role: userInfo?.role || "USER",
          };
        }

        return {
          ...goal,
          userInfo: clerkUserData,
        };
      })
    );

    return NextResponse.json({ stepGoals: goalsWithUserInfo });
  } catch (error) {
    console.error("Error fetching step goals:", error);
    return NextResponse.json(
      { error: "Failed to fetch step goals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAdmin();
    const body = await request.json();

    const { targetUserId, dailyTarget, endDate, notes, goalDurationWeeks } = body;

    if (!targetUserId || !dailyTarget) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate goal duration (1-3 weeks)
    const duration = parseInt(goalDurationWeeks) || 1;
    if (duration < 1 || duration > 3) {
      return NextResponse.json(
        { error: "Goal duration must be between 1 and 3 weeks" },
        { status: 400 }
      );
    }

    // Deactivate any existing active goals for this user
    await prisma.stepGoal.updateMany({
      where: {
        userId: targetUserId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Calculate proper end date based on duration
    const startDate = new Date();
    const calculatedEndDate = new Date(startDate);
    calculatedEndDate.setDate(startDate.getDate() + (duration * 7));

    // Create new step goal
    const stepGoal = await prisma.stepGoal.create({
      data: {
        userId: targetUserId,
        assignedBy: userId,
        dailyTarget: parseInt(dailyTarget),
        startDate: startDate,
        endDate: calculatedEndDate,
        notes,
        isActive: true,
      },
    });

    return NextResponse.json({ stepGoal });
  } catch (error) {
    console.error("Error creating step goal:", error);
    return NextResponse.json(
      { error: "Failed to create step goal" },
      { status: 500 }
    );
  }
}