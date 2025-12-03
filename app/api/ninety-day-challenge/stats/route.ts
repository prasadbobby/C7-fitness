import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get('challengeId');

    if (!challengeId) {
      return NextResponse.json({ error: "Challenge ID is required" }, { status: 400 });
    }

    // Get user's participation in the specific challenge
    const participant = await prisma.ninetyDayChallengeParticipant.findFirst({
      where: {
        userId: user.id,
        challengeId: challengeId,
        isEnabled: true,
        challenge: {
          isActive: true,
        },
      },
      include: {
        challenge: true,
      },
    });

    if (!participant) {
      return NextResponse.json({ error: "No active challenge found" }, { status: 404 });
    }

    const { challenge } = participant;
    const now = new Date();
    const startDate = new Date(challenge.startDate);
    const endDate = new Date(challenge.endDate);

    // Calculate days
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Get user's posts
    const userPosts = await prisma.ninetyDayChallengePost.findMany({
      where: {
        userId: user.id,
        challengeId: challenge.id,
      },
      orderBy: {
        date: "desc",
      },
    });

    // Calculate streak
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < daysPassed; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);

      const hasPost = userPosts.some(post => {
        const postDate = new Date(post.date);
        postDate.setHours(0, 0, 0, 0);
        return postDate.getTime() === checkDate.getTime();
      });

      if (hasPost) {
        streak++;
      } else {
        break;
      }
    }

    // Get total participants
    const totalParticipants = await prisma.ninetyDayChallengeParticipant.count({
      where: {
        challengeId: challenge.id,
        isEnabled: true,
      },
    });

    // Check if challenge is completed (ended)
    const isCompleted = now > endDate;

    return NextResponse.json({
      challengeTitle: challenge.title,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      totalDays,
      daysPassed,
      daysRemaining,
      completedDays: userPosts.length,
      streak,
      totalParticipants,
      isCompleted,
    });
  } catch (error) {
    console.error("Error fetching challenge stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}