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
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "Date parameter required" }, { status: 400 });
    }

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

    // Get post for the specified date
    const post = await prisma.ninetyDayChallengePost.findUnique({
      where: {
        userId_challengeId_date: {
          userId: user.id,
          challengeId: participant.challengeId,
          date: new Date(date),
        },
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error fetching today's post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}