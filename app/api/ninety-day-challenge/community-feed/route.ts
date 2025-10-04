import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";
import { clerkClient } from "@clerk/nextjs";

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const dateFilter = searchParams.get("date");
    const skip = (page - 1) * limit;

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

    // Build where clause with optional date filter
    // For admins, show posts from all active challenges if they don't have a participant record
    let whereClause: any = {};

    if (isAdmin && !userParticipant) {
      // Admin without participant - get active challenge
      const activeChallenge = await prisma.ninetyDayChallenge.findFirst({
        where: { isActive: true },
        select: { id: true }
      });

      if (activeChallenge) {
        whereClause.challengeId = activeChallenge.id;
      } else {
        return NextResponse.json({ posts: [], totalPages: 0, currentPage: page, totalCount: 0, currentUserId: user.id });
      }
    } else if (userParticipant) {
      whereClause.challengeId = userParticipant.challengeId;
    } else {
      return NextResponse.json({ error: "No access to active challenges" }, { status: 403 });
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      const startOfDay = new Date(filterDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(filterDate.setHours(23, 59, 59, 999));

      whereClause.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    // Get all posts from all participants in the same challenge
    const [posts, totalCount] = await Promise.all([
      prisma.ninetyDayChallengePost.findMany({
        where: whereClause,
        include: {
          reactions: true,
          comments: {
            include: {
              participant: {
                select: {
                  userId: true,
                }
              }
            },
            orderBy: {
              createdAt: 'asc'
            }
          },
          _count: {
            select: {
              reactions: true,
              comments: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.ninetyDayChallengePost.count({
        where: whereClause,
      }),
    ]);

    // Get user info from Clerk and database for all post authors and comment authors
    const postUserIds = posts.map(post => post.userId);
    const commentUserIds = posts.flatMap(post => post.comments.map(comment => comment.userId));
    const userIds = [...new Set([...postUserIds, ...commentUserIds])];

    // Get user roles from database
    const userRoles = await prisma.userInfo.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, role: true }
    });

    const userRoleMap = userRoles.reduce((acc, user) => {
      acc[user.userId] = user.role;
      return acc;
    }, {} as Record<string, string>);

    const usersInfo = await Promise.all(
      userIds.map(async (userId) => {
        try {
          const clerkUser = await clerkClient.users.getUser(userId);
          const role = userRoleMap[userId];
          const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

          return {
            userId,
            firstName: clerkUser.firstName || "Unknown",
            lastName: clerkUser.lastName || "User",
            imageUrl: clerkUser.imageUrl || "",
            username: clerkUser.username || clerkUser.firstName || "Unknown",
            isAdmin,
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

    // Enhance posts with user info and check if current user reacted
    const enhancedPosts = posts.map(post => {
      const userInfo = userInfoMap[post.userId];
      const userReaction = post.reactions.find(reaction =>
        reaction.userId === user.id
      );

      // Calculate reaction counts by type
      const reactionCounts = post.reactions.reduce((acc, reaction) => {
        acc[reaction.reactionType] = (acc[reaction.reactionType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Enhance comments with user info
      const enhancedComments = post.comments.map(comment => ({
        ...comment,
        author: userInfoMap[comment.userId] || {
          userId: comment.userId,
          firstName: "Unknown",
          lastName: "User",
          imageUrl: "",
          username: "Unknown",
        }
      }));

      return {
        ...post,
        author: userInfo,
        comments: enhancedComments,
        reactionCounts,
        userReaction: userReaction ? {
          id: userReaction.id,
          type: userReaction.reactionType,
        } : null,
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      posts: enhancedPosts,
      totalPages,
      currentPage: page,
      totalCount,
      currentUserId: user.id,
    });
  } catch (error) {
    console.error("Error fetching community feed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}