import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || "1");
    const year = parseInt(searchParams.get("year") || "2024");
    const requestedChallengeId = searchParams.get("challengeId");

    let challengeId;

    if (requestedChallengeId) {
      // Check if user has access to the requested challenge
      const requestedParticipant = await prisma.ninetyDayChallengeParticipant.findFirst({
        where: {
          userId: user.id,
          challengeId: requestedChallengeId,
          isEnabled: true,
          challenge: {
            isActive: true,
          },
        },
      });

      if (requestedParticipant) {
        challengeId = requestedChallengeId;
      } else {
        return NextResponse.json({ error: "No access to requested challenge" }, { status: 403 });
      }
    } else {
      // Fall back to user's default active challenge
      const participant = await prisma.ninetyDayChallengeParticipant.findFirst({
        where: {
          userId: user.id,
          isEnabled: true,
          challenge: {
            isActive: true,
          },
        },
      });

      if (!participant) {
        return NextResponse.json({ error: "No active challenge found" }, { status: 404 });
      }

      challengeId = participant.challengeId;
    }

    // Get start and end of the month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Get posts for the user in the specified month
    const posts = await prisma.ninetyDayChallengePost.findMany({
      where: {
        userId: user.id,
        challengeId: challengeId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        date: true,
        mood: true,
        energy: true,
      },
    });

    // Format posts for calendar display
    const formattedPosts = posts.map(post => ({
      date: post.date.toISOString(),
      hasPost: true,
      mood: post.mood,
      energy: post.energy,
    }));

    return NextResponse.json({ posts: formattedPosts });
  } catch (error) {
    console.error("Error fetching calendar posts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}