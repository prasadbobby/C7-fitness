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
    const url = new URL(request.url);
    const participantId = url.searchParams.get('participantId');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // If specific participant requested
    if (participantId) {
      const posts = await prisma.ninetyDayChallengePost.findMany({
        where: {
          participantId: participantId,
          participant: {
            challengeId: params.id,
            isEnabled: true
          }
        },
        select: {
          id: true,
          date: true,
          photos: true,
          isFasting: true, // Required for photo scoring calculation
          createdAt: true
        },
        orderBy: { date: 'desc' },
        take: limit,
        skip: offset
      });

      return NextResponse.json({ posts });
    }

    // Get all posts with photos for the challenge (paginated)
    const challenge = await prisma.ninetyDayChallenge.findUnique({
      where: { id: params.id },
      include: {
        participants: {
          where: { isEnabled: true },
          include: {
            posts: {
              select: {
                id: true,
                date: true,
                photos: true,
                isFasting: true, // Required for photo scoring calculation
                createdAt: true,
              },
              where: {
                photos: {
                  not: null
                }
              },
              orderBy: { date: 'desc' },
              take: limit,
              skip: offset
            }
          }
        }
      }
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    return NextResponse.json({
      challenge: {
        id: challenge.id,
        participants: challenge.participants
      }
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}