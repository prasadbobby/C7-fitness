import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type } = await request.json();

    if (!type) {
      return NextResponse.json({ error: "Missing reaction type" }, { status: 400 });
    }

    const commentId = params.commentId;

    // Check if user has access to any active challenge
    const userParticipant = await prisma.ninetyDayChallengeParticipant.findFirst({
      where: {
        userId: user.id,
        isEnabled: true,
        challenge: {
          isActive: true,
        },
      },
    });

    if (!userParticipant) {
      return NextResponse.json({ error: "No access to active challenges" }, { status: 403 });
    }

    // Check if the comment exists and belongs to the same challenge
    const comment = await prisma.ninetyDayChallengeComment.findFirst({
      where: {
        id: commentId,
        post: {
          challengeId: userParticipant.challengeId,
        },
      },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check if user already reacted to this comment
    const existingReaction = await prisma.ninetyDayChallengeCommentReaction.findFirst({
      where: {
        userId: user.id,
        commentId: commentId,
      },
    });

    if (existingReaction) {
      // If same reaction type, remove it (toggle off)
      if (existingReaction.reactionType === type) {
        await prisma.ninetyDayChallengeCommentReaction.delete({
          where: { id: existingReaction.id },
        });
        return NextResponse.json({ success: true, action: "removed" });
      } else {
        // Update to new reaction type
        const updatedReaction = await prisma.ninetyDayChallengeCommentReaction.update({
          where: { id: existingReaction.id },
          data: { reactionType: type },
        });
        return NextResponse.json({ success: true, action: "updated", reaction: updatedReaction });
      }
    } else {
      // Create new reaction
      const newReaction = await prisma.ninetyDayChallengeCommentReaction.create({
        data: {
          userId: user.id,
          commentId: commentId,
          reactionType: type,
        },
      });
      return NextResponse.json({ success: true, action: "created", reaction: newReaction });
    }

  } catch (error) {
    console.error("Error handling comment reaction:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}