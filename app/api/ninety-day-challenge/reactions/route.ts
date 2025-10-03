import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId, type } = await request.json();

    if (!postId || !type) {
      return NextResponse.json({ error: "Missing postId or type" }, { status: 400 });
    }

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

    // Check if the post exists and belongs to the same challenge
    const post = await prisma.ninetyDayChallengePost.findFirst({
      where: {
        id: postId,
        challengeId: userParticipant.challengeId,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if user already reacted to this post
    const existingReaction = await prisma.ninetyDayChallengeReaction.findFirst({
      where: {
        userId: user.id,
        postId: postId,
      },
    });

    if (existingReaction) {
      // If same reaction type, remove it (toggle off)
      if (existingReaction.reactionType === type) {
        await prisma.ninetyDayChallengeReaction.delete({
          where: { id: existingReaction.id },
        });
        return NextResponse.json({ success: true, action: "removed" });
      } else {
        // Update to new reaction type
        const updatedReaction = await prisma.ninetyDayChallengeReaction.update({
          where: { id: existingReaction.id },
          data: { reactionType: type },
        });
        return NextResponse.json({ success: true, action: "updated", reaction: updatedReaction });
      }
    } else {
      // Create new reaction
      const newReaction = await prisma.ninetyDayChallengeReaction.create({
        data: {
          userId: user.id,
          postId: postId,
          reactionType: type,
        },
      });
      return NextResponse.json({ success: true, action: "created", reaction: newReaction });
    }

  } catch (error) {
    console.error("Error handling reaction:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}