import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/utils/adminAuth";
import prisma from "@/prisma/prisma";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Get participant details
    const participant = await prisma.ninetyDayChallengeParticipant.findUnique({
      where: { id: params.id },
      include: {
        challenge: true,
        posts: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    const { challenge, posts } = participant;
    const now = new Date();
    const startDate = new Date(challenge.startDate);
    const endDate = new Date(challenge.endDate);

    // Calculate days
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const completedDays = posts.length;
    const completionRate = daysPassed > 0 ? (completedDays / daysPassed) * 100 : 0;

    // Calculate streak
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < daysPassed; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);

      const hasPost = posts.some(post => {
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

    return NextResponse.json({
      totalDays,
      daysPassed,
      completedDays,
      streak,
      completionRate,
      lastPostDate: posts.length > 0 ? posts[0].date : null,
    });
  } catch (error) {
    console.error("Error fetching participant stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}