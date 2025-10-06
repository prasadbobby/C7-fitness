import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      include: {
        challenge: true,
      },
    });

    if (!participant) {
      return NextResponse.json({ error: "No active challenge found" }, { status: 404 });
    }

    return NextResponse.json({
      challengeId: participant.challenge.id,
      title: participant.challenge.title,
      description: participant.challenge.description,
      startDate: participant.challenge.startDate,
      endDate: participant.challenge.endDate,
    });
  } catch (error) {
    console.error("Error fetching challenge info:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}