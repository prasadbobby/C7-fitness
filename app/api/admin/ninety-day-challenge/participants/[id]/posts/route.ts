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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Verify participant exists
    const participant = await prisma.ninetyDayChallengeParticipant.findUnique({
      where: { id: params.id },
    });

    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    // Get posts with pagination
    const [posts, totalCount] = await Promise.all([
      prisma.ninetyDayChallengePost.findMany({
        where: { participantId: params.id },
        include: {
          _count: {
            select: {
              reactions: true,
            },
          },
        },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.ninetyDayChallengePost.count({
        where: { participantId: params.id },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      posts,
      totalPages,
      currentPage: page,
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching participant posts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}