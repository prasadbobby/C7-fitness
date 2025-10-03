import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId, content } = await request.json();

    if (!postId || !content?.trim()) {
      return NextResponse.json({ error: "Post ID and content are required" }, { status: 400 });
    }

    // Check if user is a participant in the challenge that owns this post
    const post = await prisma.ninetyDayChallengePost.findUnique({
      where: { id: postId },
      include: { challenge: true }
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if user is admin
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId: user.id },
      select: { role: true }
    });

    const isAdmin = userInfo?.role === 'ADMIN' || userInfo?.role === 'SUPER_ADMIN';

    // Check if user is a participant in the challenge
    const participant = await prisma.ninetyDayChallengeParticipant.findFirst({
      where: {
        userId: user.id,
        challengeId: post.challengeId,
        isEnabled: true,
      },
    });

    // Allow access if user is admin OR participant
    if (!isAdmin && !participant) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Create the comment
    const comment = await prisma.ninetyDayChallengeComment.create({
      data: {
        postId,
        userId: user.id,
        participantId: participant?.id, // Can be null for admin users
        content: content.trim(),
      },
      include: {
        participant: {
          select: {
            userId: true,
          }
        }
      }
    });

    // Get user info for the comment (we already have userInfo from above)

    const commentWithUser = {
      ...comment,
      author: {
        userId: user.id,
        firstName: user.firstName || "Unknown",
        lastName: user.lastName || "User",
        imageUrl: user.imageUrl || "",
      }
    };

    return NextResponse.json({ comment: commentWithUser }, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}