import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/utils/adminAuth";
import prisma from "@/prisma/prisma";

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const challengeId = params.id;

    // First, verify the challenge exists
    const challenge = await prisma.ninetyDayChallenge.findUnique({
      where: { id: challengeId },
      select: { id: true, title: true }
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Reset all points by updating participants' joinedAt date to today
    // This will make the scoring calculation start fresh from today while keeping all posts intact
    const today = new Date();
    const result = await prisma.ninetyDayChallengeParticipant.updateMany({
      where: {
        challengeId: challengeId
      },
      data: {
        joinedAt: today,
        completedDays: 0,
        lastActiveDate: null
      }
    });

    console.log(`Reset points for challenge ${challengeId}: Updated ${result.count} participants' joinedAt date to ${today.toISOString()}`);

    return NextResponse.json({
      success: true,
      message: `Successfully reset all points for challenge "${challenge.title}". All scores will now be calculated from today onwards.`,
      participantsUpdated: result.count,
      resetDate: today.toISOString()
    });

  } catch (error) {
    console.error('Error resetting challenge points:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}