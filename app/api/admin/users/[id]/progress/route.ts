import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { requireAdmin } from "@/utils/adminAuth";
import { clerkClient } from "@clerk/nextjs";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const { id } = params;

    // Fetch user info from database by database ID
    const userInfo = await prisma.userInfo.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        age: true,
        height: true,
        weight: true,
        role: true,
        createdAt: true,
      },
    });

    if (!userInfo) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch Clerk user data using the userId
    let clerkUser;
    try {
      clerkUser = await clerkClient.users.getUser(userInfo.userId);
    } catch (error) {
      console.error("Error fetching Clerk user:", error);
    }

    // Fetch assignments
    const assignments = await prisma.assignedWorkout.findMany({
      where: { userId: userInfo.userId },
      orderBy: { assignedAt: "desc" },
      select: {
        id: true,
        status: true,
        assignedAt: true,
        dueDate: true,
        notes: true,
        workoutPlan: {
          select: {
            name: true,
            trainingType: true,
          },
        },
      },
    });

    // Fetch workout logs
    const workoutLogs = await prisma.workoutLog.findMany({
      where: { userId: userInfo.userId },
      orderBy: { date: "desc" },
      take: 50, // Limit to last 50 workouts
      select: {
        id: true,
        date: true,
        duration: true,
        totalRestTimeSeconds: true,    // Include rest time data
        totalActiveTimeSeconds: true,  // Include active time data
        WorkoutPlan: {
          select: {
            name: true,
          },
        },
        exercises: {
          select: {
            id: true,
            exerciseId: true,
            trackingType: true,
            Exercise: {
              select: {
                name: true,
              },
            },
            sets: {
              select: {
                id: true,
                weight: true,
                reps: true,
                exerciseDuration: true,
                restTimeSeconds: true,     // Include per-set rest time
                setStartTime: true,        // Include set timing data
                setEndTime: true,          // Include set end time
              },
            },
          },
        },
      },
    });

    // Calculate stats
    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(a => a.status === "COMPLETED").length;
    const absentCount = assignments.filter(a => a.status === "ABSENT").length;
    const skippedCount = assignments.filter(a => a.status === "SKIPPED").length;
    const completionRate = totalAssignments > 0
      ? Math.round((completedAssignments / totalAssignments) * 100)
      : 0;

    const totalWorkouts = workoutLogs.length;
    const avgWorkoutDuration = totalWorkouts > 0
      ? Math.round(workoutLogs.reduce((sum, log) => sum + log.duration, 0) / totalWorkouts)
      : 0;

    // Calculate streak (consecutive days with workouts)
    let streakDays = 0;
    try {
      const sortedLogs = workoutLogs
        .map(log => new Date(log.date).toISOString().split('T')[0])
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      if (sortedLogs.includes(today) || sortedLogs.includes(yesterday)) {
        let currentDate = sortedLogs.includes(today) ? today : yesterday;
        let dateIndex = 0;

        while (dateIndex < sortedLogs.length && sortedLogs[dateIndex] === currentDate) {
          streakDays++;
          const nextDate = new Date(currentDate);
          nextDate.setDate(nextDate.getDate() - 1);
          currentDate = nextDate.toISOString().split('T')[0];
          dateIndex++;

          // Skip to next matching date
          while (dateIndex < sortedLogs.length && sortedLogs[dateIndex] > currentDate) {
            dateIndex++;
          }
        }
      }
    } catch (streakError) {
      console.error("Error calculating streak:", streakError);
      streakDays = 0;
    }

    const user = {
      id: userInfo.id,
      userId: userInfo.userId,
      username: clerkUser?.username,
      firstName: clerkUser?.firstName,
      email: clerkUser?.emailAddresses?.[0]?.emailAddress,
      imageUrl: clerkUser?.imageUrl,
      age: userInfo.age,
      height: userInfo.height,
      weight: userInfo.weight,
      role: userInfo.role,
    };

    const stats = {
      totalAssignments,
      completedAssignments,
      absentCount,
      skippedCount,
      completionRate,
      avgWorkoutDuration,
      totalWorkouts,
      streakDays,
    };

    return NextResponse.json({
      user,
      assignments,
      workoutLogs,
      stats,
    });

  } catch (error) {
    console.error("Error fetching user progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch user progress", details: error.message },
      { status: 500 }
    );
  }
}