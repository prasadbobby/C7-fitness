import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const stepLogs = await prisma.stepLog.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
        },
      },
      include: {
        stepGoal: true,
      },
      orderBy: { date: "desc" },
    });

    // Get current active goal
    const activeGoal = await prisma.stepGoal.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    return NextResponse.json({ stepLogs, activeGoal });
  } catch (error) {
    console.error("Error fetching step logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch step logs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { steps, date } = body;

    if (!steps || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const logDate = new Date(date);
    logDate.setHours(0, 0, 0, 0);

    // Get active goal and check if it's expired
    const activeGoal = await prisma.stepGoal.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    // Check if goal is expired and deactivate it
    if (activeGoal && activeGoal.endDate && new Date() > activeGoal.endDate) {
      await prisma.stepGoal.update({
        where: { id: activeGoal.id },
        data: { isActive: false },
      });

      return NextResponse.json(
        { error: "Step goal has expired. Please contact your trainer for a new goal." },
        { status: 400 }
      );
    }

    // Calculate target steps including carry-over logic
    console.log('Calculating daily target for:', {
      userId,
      logDate: logDate.toISOString(),
      baseDailyTarget: activeGoal?.dailyTarget || 10000
    });

    const { targetSteps, carryOverSteps, excessSteps, weeklyProgress } = await calculateDailyTarget(
      userId,
      logDate,
      activeGoal?.dailyTarget || 10000
    );

    console.log('Daily target calculation result:', {
      targetSteps,
      carryOverSteps,
      excessSteps,
      weeklyProgress
    });

    // Create or update step log
    const stepLog = await prisma.stepLog.upsert({
      where: {
        userId_date: {
          userId,
          date: logDate,
        },
      },
      update: {
        actualSteps: parseInt(steps),
        targetSteps,
        carryOverSteps,
        excessSteps,
        isCompleted: parseInt(steps) >= targetSteps,
      },
      create: {
        userId,
        stepGoalId: activeGoal?.id,
        date: logDate,
        actualSteps: parseInt(steps),
        targetSteps,
        carryOverSteps,
        excessSteps,
        isCompleted: parseInt(steps) >= targetSteps,
      },
    });

    return NextResponse.json({
      stepLog,
      weeklyProgress,
      message: weeklyProgress.isLastDayOfWeek
        ? "🎯 Last day of the week! Complete your weekly target today!"
        : `📊 ${weeklyProgress.remainingDaysInWeek} days remaining this week`
    });
  } catch (error) {
    console.error("Error logging steps:", error);
    return NextResponse.json(
      { error: "Failed to log steps" },
      { status: 500 }
    );
  }
}

// Helper function to calculate daily target with improved carry-over logic
async function calculateDailyTarget(
  userId: string,
  date: Date,
  baseDailyTarget: number
) {
  console.log('=== Daily Target Calculation ===');
  console.log('Input parameters:', { userId, date: date.toISOString(), baseDailyTarget });
  // Get the current week's range (Sunday to Saturday)
  const currentWeekStart = new Date(date);
  const dayOfWeek = currentWeekStart.getDay(); // 0 = Sunday, 6 = Saturday
  currentWeekStart.setDate(currentWeekStart.getDate() - dayOfWeek);
  currentWeekStart.setHours(0, 0, 0, 0);

  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
  currentWeekEnd.setHours(23, 59, 59, 999);

  // Get all logs for the current week up to the day before the log date
  const weekLogs = await prisma.stepLog.findMany({
    where: {
      userId,
      date: {
        gte: currentWeekStart,
        lt: date, // Only logs before the target date
      },
    },
    orderBy: { date: "asc" },
  });

  // Calculate total weekly target and actual steps so far
  const daysElapsed = weekLogs.length;
  const totalWeeklyTarget = baseDailyTarget * 7;
  const expectedStepsByNow = baseDailyTarget * daysElapsed;
  const actualStepsThisWeek = weekLogs.reduce((sum, log) => sum + log.actualSteps, 0);

  // Calculate accumulated deficit or credit for the week
  const weeklyDeficit = Math.max(0, expectedStepsByNow - actualStepsThisWeek);
  const weeklyCredit = Math.max(0, actualStepsThisWeek - expectedStepsByNow);

  // Get previous day's individual carry-over
  const previousDate = new Date(date);
  previousDate.setDate(previousDate.getDate() - 1);

  console.log('Previous date calculation:', {
    targetDate: date.toISOString(),
    previousDate: previousDate.toISOString()
  });

  const previousLog = await prisma.stepLog.findUnique({
    where: {
      userId_date: {
        userId,
        date: previousDate,
      },
    },
  });

  console.log('Previous log found:', previousLog ? {
    date: previousLog.date.toISOString(),
    actualSteps: previousLog.actualSteps,
    targetSteps: previousLog.targetSteps
  } : null);

  let dailyCarryOver = 0;
  let dailyCredit = 0;

  if (previousLog) {
    if (previousLog.actualSteps < previousLog.targetSteps) {
      dailyCarryOver = previousLog.targetSteps - previousLog.actualSteps;
    } else if (previousLog.actualSteps > previousLog.targetSteps) {
      dailyCredit = previousLog.actualSteps - previousLog.targetSteps;
    }
  }

  // Determine remaining days in the week
  const remainingDaysInWeek = 7 - daysElapsed - 1; // -1 for today
  const isLastDayOfWeek = remainingDaysInWeek === 0;

  let targetSteps = baseDailyTarget;
  let carryOverSteps = 0;
  let excessSteps = 0;

  if (isLastDayOfWeek) {
    // Last day of week: Must complete all remaining weekly targets
    const remainingWeeklyTarget = totalWeeklyTarget - actualStepsThisWeek;
    targetSteps = Math.max(remainingWeeklyTarget, baseDailyTarget);
    carryOverSteps = Math.max(0, remainingWeeklyTarget - baseDailyTarget);
  } else {
    // Regular day: Apply carry-over logic but spread weekly deficit across remaining days
    const weeklyDeficitPerDay = remainingDaysInWeek > 0 ? Math.ceil(weeklyDeficit / (remainingDaysInWeek + 1)) : 0;

    // Combine daily carry-over with weekly spread
    carryOverSteps = Math.max(dailyCarryOver, weeklyDeficitPerDay);
    excessSteps = Math.min(dailyCredit, weeklyCredit / (remainingDaysInWeek + 1));

    targetSteps = Math.max(
      baseDailyTarget + carryOverSteps - excessSteps,
      Math.floor(baseDailyTarget * 0.3) // Minimum 30% of base target
    );
  }

  return {
    targetSteps: Math.round(targetSteps),
    carryOverSteps: Math.round(carryOverSteps),
    excessSteps: Math.round(excessSteps),
    weeklyProgress: {
      totalWeeklyTarget,
      actualStepsThisWeek,
      remainingDaysInWeek: remainingDaysInWeek + 1, // +1 for today
      isLastDayOfWeek
    }
  };
}