import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      sleepHours,
      sleepQuality,
      mealTracking,
      dayDescription,
      mood,
      energy,
      achievements,
      challenges,
      photos,
    } = await request.json();

    // Check if the post belongs to the current user
    const existingPost = await prisma.ninetyDayChallengePost.findUnique({
      where: { id: params.id },
    });

    if (!existingPost || existingPost.userId !== user.id) {
      return NextResponse.json({ error: "Post not found or unauthorized" }, { status: 404 });
    }

    const post = await prisma.ninetyDayChallengePost.update({
      where: { id: params.id },
      data: {
        sleepHours,
        sleepQuality,
        mealTracking,
        dayDescription,
        mood,
        energy,
        achievements,
        challenges,
        photos: photos || [],
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error updating post:", error);
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

    // Check if user is admin
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId: user.id },
      select: { role: true }
    });

    const isAdmin = userInfo?.role === 'ADMIN' || userInfo?.role === 'SUPER_ADMIN';

    // Check if the post exists and either belongs to the user or user is admin
    const existingPost = await prisma.ninetyDayChallengePost.findUnique({
      where: { id: params.id },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Allow deletion if user owns the post or is admin
    if (!isAdmin && existingPost.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized to delete this post" }, { status: 403 });
    }

    // Delete related data first
    await prisma.ninetyDayChallengeReaction.deleteMany({
      where: { postId: params.id }
    });

    await prisma.ninetyDayChallengeComment.deleteMany({
      where: { postId: params.id }
    });

    // Delete the post
    await prisma.ninetyDayChallengePost.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}