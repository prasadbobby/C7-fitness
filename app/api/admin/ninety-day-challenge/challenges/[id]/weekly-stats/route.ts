import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";
import {
  getChallengeWeeks,
  calculateWeeklyMetrics,
  calculateWeeklyScore,
  formatWeekDisplay
} from "@/utils/weeklyScoring";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId: user.id },
      select: { role: true }
    });

    const isAdmin = userInfo?.role === 'ADMIN' || userInfo?.role === 'SUPER_ADMIN';

    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const challengeId = params.id;
    const { searchParams } = new URL(request.url);
    const weekNumber = searchParams.get("week");

    // Get challenge with participants and posts
    const challenge = await prisma.ninetyDayChallenge.findUnique({
      where: { id: challengeId },
      include: {
        participants: {
          where: { isEnabled: true },
          include: {
            posts: {
              select: {
                date: true,
                sleepHours: true,
                sleepQuality: true,
                mood: true,
                energy: true,
                photos: true,
                isFasting: true, // Required for photo scoring calculation
                createdAt: true,
              },
              orderBy: { date: 'asc' }
            }
          }
        }
      }
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Get user info from Clerk for all participants
    const userIds = challenge.participants.map(p => p.userId);
    const usersInfo = await Promise.all(
      userIds.map(async (userId) => {
        try {
          const clerkUser = await (await import("@clerk/nextjs")).clerkClient.users.getUser(userId);
          return {
            userId,
            firstName: clerkUser.firstName || "Unknown",
            lastName: clerkUser.lastName || "User",
            imageUrl: clerkUser.imageUrl || "",
            email: clerkUser.emailAddresses[0]?.emailAddress || "",
            username: clerkUser.username || clerkUser.firstName || "Unknown",
          };
        } catch (error) {
          return {
            userId,
            firstName: "Unknown",
            lastName: "User",
            imageUrl: "",
            email: "",
            username: "Unknown",
          };
        }
      })
    );

    const userInfoMap = usersInfo.reduce((acc, user) => {
      acc[user.userId] = user;
      return acc;
    }, {} as Record<string, any>);

    // Enhance participants with user info
    const enhancedParticipants = challenge.participants.map(participant => ({
      ...participant,
      user: userInfoMap[participant.userId] || {
        firstName: "Unknown",
        lastName: "User",
        imageUrl: "",
        email: "",
        username: "Unknown",
      }
    }));

    // Get all weeks for the challenge
    const weeks = getChallengeWeeks(challenge.startDate.toISOString(), challenge.endDate?.toISOString());

    if (weekNumber) {
      // Get specific week stats
      const week = weeks.find(w => w.weekNumber === parseInt(weekNumber));
      if (!week) {
        return NextResponse.json({ error: "Week not found" }, { status: 404 });
      }

      const weeklyParticipants = enhancedParticipants.map(participant => {
        const weeklyMetrics = calculateWeeklyMetrics(
          participant.posts,
          week,
          participant.joinedAt.toISOString()
        );
        const weeklyScore = calculateWeeklyScore(weeklyMetrics);

        return {
          id: participant.id,
          userId: participant.userId,
          user: participant.user,
          weeklyScore,
          weeklyMetrics
        };
      }).sort((a, b) => b.weeklyScore - a.weeklyScore);

      return NextResponse.json({
        week: {
          ...week,
          displayName: formatWeekDisplay(week)
        },
        participants: weeklyParticipants,
        summary: {
          totalParticipants: weeklyParticipants.length,
          activeParticipants: weeklyParticipants.filter(p => p.weeklyMetrics.totalPosts > 0).length,
          averageScore: weeklyParticipants.length > 0
            ? Math.round(weeklyParticipants.reduce((sum, p) => sum + p.weeklyScore, 0) / weeklyParticipants.length)
            : 0,
          topScore: weeklyParticipants.length > 0 ? weeklyParticipants[0].weeklyScore : 0
        }
      });
    } else {
      // Get all weeks summary
      const weeksSummary = weeks.map(week => {
        const weeklyParticipants = enhancedParticipants.map(participant => {
          const weeklyMetrics = calculateWeeklyMetrics(
            participant.posts,
            week,
            participant.joinedAt.toISOString()
          );
          const weeklyScore = calculateWeeklyScore(weeklyMetrics);
          return { weeklyScore, weeklyMetrics };
        });

        const activeParticipants = weeklyParticipants.filter(p => p.weeklyMetrics.totalPosts > 0).length;
        const averageScore = weeklyParticipants.length > 0
          ? Math.round(weeklyParticipants.reduce((sum, p) => sum + p.weeklyScore, 0) / weeklyParticipants.length)
          : 0;
        const topScore = weeklyParticipants.length > 0 ? Math.max(...weeklyParticipants.map(p => p.weeklyScore)) : 0;

        return {
          ...week,
          displayName: formatWeekDisplay(week),
          summary: {
            totalParticipants: enhancedParticipants.length,
            activeParticipants,
            averageScore,
            topScore
          }
        };
      });

      return NextResponse.json({
        challengeId: challenge.id,
        challengeTitle: challenge.title,
        weeks: weeksSummary
      });
    }
  } catch (error) {
    console.error("Error fetching weekly stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}