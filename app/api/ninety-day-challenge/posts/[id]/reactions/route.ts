import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reactionType } = await request.json();

    if (!reactionType) {
      return NextResponse.json({ error: "Reaction type required" }, { status: 400 });
    }

    // Check if post exists
    const post = await prisma.ninetyDayChallengePost.findUnique({
      where: { id: params.id },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Remove any existing reaction from this user for this post
    await prisma.ninetyDayChallengeReaction.deleteMany({
      where: {
        userId: user.id,
        postId: params.id,
      },
    });

    // Add the new reaction
    const reaction = await prisma.ninetyDayChallengeReaction.create({
      data: {
        userId: user.id,
        postId: params.id,
        reactionType,
      },
    });

    return NextResponse.json({ reaction });
  } catch (error) {
    console.error("Error adding reaction:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reactionType } = await request.json();

    // Remove the specific reaction
    await prisma.ninetyDayChallengeReaction.deleteMany({
      where: {
        userId: user.id,
        postId: params.id,
        reactionType,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing reaction:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}