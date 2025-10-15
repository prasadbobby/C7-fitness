import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const postId = params.id;

    // Check if user is admin
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId: user.id },
      select: { role: true }
    });

    const isAdmin = userInfo?.role === 'ADMIN' || userInfo?.role === 'SUPER_ADMIN';

    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Check if the post exists
    const post = await prisma.ninetyDayChallengePost.findUnique({
      where: { id: postId },
      select: {
        id: true,
        isPinned: true,
        challengeId: true
      }
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Toggle pin status
    const updatedPost = await prisma.ninetyDayChallengePost.update({
      where: { id: postId },
      data: {
        isPinned: !post.isPinned,
        pinnedAt: !post.isPinned ? new Date() : null,
        pinnedBy: !post.isPinned ? user.id : null,
      },
      select: {
        id: true,
        isPinned: true,
        pinnedAt: true,
        pinnedBy: true,
      }
    });

    return NextResponse.json({
      success: true,
      post: updatedPost,
      message: updatedPost.isPinned ? "Post pinned successfully" : "Post unpinned successfully"
    });

  } catch (error) {
    console.error("Error toggling post pin status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}