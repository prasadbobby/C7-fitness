import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || "1");
    const year = parseInt(searchParams.get("year") || "2024");

    // Get user's active challenge participation
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

    // Get start and end of the month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Get posts for the user in the specified month
    const posts = await prisma.ninetyDayChallengePost.findMany({
      where: {
        userId: user.id,
        challengeId: participant.challengeId,
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