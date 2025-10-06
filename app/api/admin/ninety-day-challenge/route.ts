import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/utils/adminAuth";
import prisma from "@/prisma/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const getStats = searchParams.get('stats');

    if (getStats === 'true') {
      // Get stats for dashboard
      const activeChallenges = await prisma.ninetyDayChallenge.count({
        where: { isActive: true }
      });

      const totalParticipants = await prisma.ninetyDayChallengeParticipant.count({
        where: { isEnabled: true }
      });

      const participants = await prisma.ninetyDayChallengeParticipant.findMany({
        where: { isEnabled: true },
        select: { completedDays: true }
      });

      const completedChallenges = participants.filter(p => p.completedDays >= 90).length;
      const completionRate = totalParticipants > 0 ? Math.round((completedChallenges / totalParticipants) * 100) : 0;

      const avgProgress = totalParticipants > 0
        ? Math.round(participants.reduce((sum, p) => sum + p.completedDays, 0) / totalParticipants)
        : 0;

      return NextResponse.json({
        stats: {
          activeChallenges,
          totalParticipants,
          completionRate,
          avgProgress
        }
      });
    }

    const challenges = await prisma.ninetyDayChallenge.findMany({
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedChallenges = challenges.map((challenge) => ({
      ...challenge,
      participantCount: challenge._count.participants,
    }));

    return NextResponse.json({ challenges: formattedChallenges });
  } catch (error) {
    console.error("Error fetching challenges:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAdmin();

    const { title, description, startDate, endDate, isActive } = await request.json();

    if (!title || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const challenge = await prisma.ninetyDayChallenge.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive,
        createdBy: userId,
      },
    });

    return NextResponse.json({ challenge });
  } catch (error) {
    console.error("Error creating challenge:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}