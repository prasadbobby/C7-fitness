import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";
import { clerkClient } from "@clerk/nextjs";

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

    // Check if user is admin
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId: user.id },
      select: { role: true }
    });

    const isAdmin = userInfo?.role === 'ADMIN' || userInfo?.role === 'SUPER_ADMIN';

    if (!userParticipant && !isAdmin) {
      return NextResponse.json({ error: "No access to active challenges" }, { status: 403 });
    }

    // Check if the post exists and belongs to the same challenge
    const post = await prisma.ninetyDayChallengePost.findFirst({
      where: {
        id: postId,
        challengeId: userParticipant?.challengeId || undefined,
      },
    });

    if (!post && !isAdmin) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // For admins, get any post regardless of challenge
    const adminPost = isAdmin && !post ? await prisma.ninetyDayChallengePost.findUnique({
      where: { id: postId }
    }) : post;

    if (!adminPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Record the view (upsert to avoid duplicates)
    await prisma.ninetyDayChallengePostView.upsert({
      where: {
        userId_postId: {
          userId: user.id,
          postId: postId,
        }
      },
      create: {
        userId: user.id,
        postId: postId,
      },
      update: {
        viewedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording post view:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const postId = params.id;

    // Check if user has access to any active challenge or is admin
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId: user.id },
      select: { role: true }
    });

    const isAdmin = userInfo?.role === 'ADMIN' || userInfo?.role === 'SUPER_ADMIN';

    const userParticipant = await prisma.ninetyDayChallengeParticipant.findFirst({
      where: {
        userId: user.id,
        isEnabled: true,
        challenge: {
          isActive: true,
        },
      },
    });

    if (!userParticipant && !isAdmin) {
      return NextResponse.json({ error: "No access to active challenges" }, { status: 403 });
    }

    // Get all views for this post
    const views = await prisma.ninetyDayChallengePostView.findMany({
      where: {
        postId: postId,
      },
      include: {
        post: {
          select: {
            challengeId: true,
          }
        }
      },
      orderBy: {
        viewedAt: 'desc'
      }
    });

    // Get user IDs for Clerk data
    const userIds = views.map(view => view.userId);

    // Get user roles from database
    const userRoles = await prisma.userInfo.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, role: true }
    });

    const userRoleMap = userRoles.reduce((acc, user) => {
      acc[user.userId] = user.role;
      return acc;
    }, {} as Record<string, string>);

    // Get user info from Clerk
    const usersInfo = await Promise.all(
      userIds.map(async (userId) => {
        try {
          const clerkUser = await clerkClient.users.getUser(userId);
          const role = userRoleMap[userId];
          const isUserAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

          return {
            userId,
            firstName: clerkUser.firstName || "Unknown",
            lastName: clerkUser.lastName || "User",
            imageUrl: clerkUser.imageUrl || "",
            username: clerkUser.username || clerkUser.firstName || "Unknown",
            isAdmin: isUserAdmin,
          };
        } catch (error) {
          return {
            userId,
            firstName: "Unknown",
            lastName: "User",
            imageUrl: "",
            username: "Unknown",
            isAdmin: false,
          };
        }
      })
    );

    const userInfoMap = usersInfo.reduce((acc, user) => {
      acc[user.userId] = user;
      return acc;
    }, {} as Record<string, any>);

    // Enhance views with user info
    const enhancedViews = views.map(view => ({
      id: view.id,
      viewedAt: view.viewedAt,
      user: userInfoMap[view.userId] || {
        userId: view.userId,
        firstName: "Unknown",
        lastName: "User",
        imageUrl: "",
        username: "Unknown",
        isAdmin: false,
      }
    }));

    return NextResponse.json({
      views: enhancedViews,
      totalViews: views.length,
    });
  } catch (error) {
    console.error("Error fetching post views:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}