import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active step goal and check if it's expired
    let activeGoal = await prisma.stepGoal.findFirst({
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
      activeGoal = null; // Set to null so UI shows "no active goal"
    }

    // Get today's step log - ensure UTC consistency
    const today = new Date();
    // Create a proper UTC date for today
    const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0));

    const todayLog = await prisma.stepLog.findUnique({
      where: {
        userId_date: {
          userId,
          date: todayUTC,
        },
      },
    });

    // Get last 7 days of step logs
    const sevenDaysAgo = new Date(todayUTC);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const weeklyLogs = await prisma.stepLog.findMany({
      where: {
        userId,
        date: {
          gte: sevenDaysAgo,
          lte: todayUTC,
        },
      },
      orderBy: { date: "asc" },
    });

    // Get last 30 days for monthly stats
    const thirtyDaysAgo = new Date(todayUTC);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

    const monthlyLogs = await prisma.stepLog.findMany({
      where: {
        userId,
        date: {
          gte: thirtyDaysAgo,
          lte: todayUTC,
        },
      },
      orderBy: { date: "asc" },
    });

    // Calculate stats
    const stats = calculateStepStats(monthlyLogs, weeklyLogs, activeGoal);

    // Get current streak
    const streak = await calculateStreak(userId, todayUTC);

    // Calculate weekly progress for current week
    const currentWeekStart = new Date(todayUTC);
    const dayOfWeek = currentWeekStart.getDay();
    currentWeekStart.setDate(currentWeekStart.getDate() - dayOfWeek);
    currentWeekStart.setHours(0, 0, 0, 0);

    const currentWeekLogs = await prisma.stepLog.findMany({
      where: {
        userId,
        date: {
          gte: currentWeekStart,
          lte: todayUTC,
        },
      },
      orderBy: { date: "asc" },
    });

    const weeklyProgress = activeGoal ? {
      totalWeeklyTarget: activeGoal.dailyTarget * 7,
      actualStepsThisWeek: currentWeekLogs.reduce((sum, log) => sum + log.actualSteps, 0),
      targetStepsThisWeek: currentWeekLogs.reduce((sum, log) => sum + log.targetSteps, 0),
      daysCompleted: currentWeekLogs.filter(log => log.isCompleted).length,
      remainingDays: 7 - currentWeekLogs.length,
      isOnTrack: currentWeekLogs.reduce((sum, log) => sum + log.actualSteps, 0) >=
                 (activeGoal.dailyTarget * currentWeekLogs.length),
      currentWeekLogs
    } : null;

    return NextResponse.json({
      activeGoal,
      todayLog,
      weeklyLogs,
      monthlyLogs,
      stats,
      streak,
      weeklyProgress,
    });
  } catch (error) {
    console.error("Error fetching step dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch step dashboard" },
      { status: 500 }
    );
  }
}

function calculateStepStats(monthlyLogs: any[], weeklyLogs: any[], activeGoal: any) {
  const totalStepsMonth = monthlyLogs.reduce((sum, log) => sum + log.actualSteps, 0);
  const totalStepsWeek = weeklyLogs.reduce((sum, log) => sum + log.actualSteps, 0);

  const completedDaysMonth = monthlyLogs.filter(log => log.isCompleted).length;
  const completedDaysWeek = weeklyLogs.filter(log => log.isCompleted).length;

  const avgStepsMonth = monthlyLogs.length > 0 ? Math.round(totalStepsMonth / monthlyLogs.length) : 0;
  const avgStepsWeek = weeklyLogs.length > 0 ? Math.round(totalStepsWeek / weeklyLogs.length) : 0;

  const completionRateMonth = monthlyLogs.length > 0 ? Math.round((completedDaysMonth / monthlyLogs.length) * 100) : 0;
  const completionRateWeek = weeklyLogs.length > 0 ? Math.round((completedDaysWeek / weeklyLogs.length) * 100) : 0;

  const maxStepsDay = monthlyLogs.length > 0 ? Math.max(...monthlyLogs.map(log => log.actualSteps)) : 0;

  return {
    totalStepsMonth,
    totalStepsWeek,
    avgStepsMonth,
    avgStepsWeek,
    completionRateMonth,
    completionRateWeek,
    completedDaysMonth,
    completedDaysWeek,
    maxStepsDay,
    currentTarget: activeGoal?.dailyTarget || 0,
  };
}

async function calculateStreak(userId: string, today: Date) {
  let streak = 0;
  let currentDate = new Date(today);

  while (true) {
    const log = await prisma.stepLog.findUnique({
      where: {
        userId_date: {
          userId,
          date: currentDate,
        },
      },
    });

    if (!log || !log.isCompleted) {
      break;
    }

    streak++;
    currentDate.setDate(currentDate.getDate() - 1);

    // Prevent infinite loop
    if (streak > 365) break;
  }

  return streak;
}