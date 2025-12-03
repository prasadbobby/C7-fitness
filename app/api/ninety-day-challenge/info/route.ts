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
    const requestedChallengeId = searchParams.get("challengeId");

    let challengeData;

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
        include: {
          challenge: true,
        },
      });

      if (requestedParticipant) {
        challengeData = requestedParticipant.challenge;
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
        include: {
          challenge: true,
        },
      });

      if (!participant) {
        return NextResponse.json({ error: "No active challenge found" }, { status: 404 });
      }

      challengeData = participant.challenge;
    }

    return NextResponse.json({
      challengeId: challengeData.id,
      title: challengeData.title,
      description: challengeData.description,
      startDate: challengeData.startDate,
      endDate: challengeData.endDate,
    });
  } catch (error) {
    console.error("Error fetching challenge info:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}