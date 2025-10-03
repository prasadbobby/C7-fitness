import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is enabled for any active challenge
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

    return NextResponse.json({
      isEnabled: !!participant,
      challengeId: participant?.challengeId || null,
      challengeTitle: participant?.challenge.title || null,
    });
  } catch (error) {
    console.error("Error checking challenge access:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}