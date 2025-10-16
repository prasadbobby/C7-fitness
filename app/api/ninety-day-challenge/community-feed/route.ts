import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";
import { clerkClient } from "@clerk/nextjs";

export const dynamic = 'force-dynamic';

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
    const requestedChallengeId = searchParams.get("challengeId");
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

    // If a specific challengeId is requested, use that (with proper access checks)
    if (requestedChallengeId) {
      // Verify user has access to this challenge
      const hasAccess = isAdmin || (userParticipant && userParticipant.challengeId === requestedChallengeId);

      if (!hasAccess) {
        return NextResponse.json({ error: "No access to requested challenge" }, { status: 403 });
      }

      whereClause.challengeId = requestedChallengeId;
    } else if (isAdmin && !userParticipant) {
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
      // Parse the date string in local timezone to avoid timezone shifting
      const [year, month, day] = dateFilter.split('-').map(Number);
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

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
            where: {
              parentCommentId: null, // Only get top-level comments
            },
            include: {
              participant: {
                select: {
                  userId: true,
                }
              },
              reactions: true,
              replies: {
                include: {
                  participant: {
                    select: {
                      userId: true,
                    }
                  },
                  reactions: true,
                },
                orderBy: {
                  createdAt: 'asc'
                }
              },
            },
            orderBy: {
              createdAt: 'asc'
            }
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: [
          { isPinned: "desc" },        // Pinned posts first
          { pinnedAt: "desc" },        // Latest pinned posts first among pinned
          { updatedAt: "desc" }        // Then by update time for regular posts
        ],
        skip,
        take: limit,
      }),
      prisma.ninetyDayChallengePost.count({
        where: whereClause,
      }),
    ]);

    // Get user info from Clerk and database for all post authors, comment authors, reply authors, and reaction users
    const postUserIds = posts.map(post => post.userId);
    const commentUserIds = posts.flatMap(post => post.comments.map(comment => comment.userId));
    const replyUserIds = posts.flatMap(post =>
      post.comments.flatMap(comment => comment.replies?.map(reply => reply.userId) || [])
    );
    const reactionUserIds = posts.flatMap(post => post.reactions.map(reaction => reaction.userId));
    const commentReactionUserIds = posts.flatMap(post =>
      post.comments.flatMap(comment => comment.reactions.map(reaction => reaction.userId))
    );
    const replyReactionUserIds = posts.flatMap(post =>
      post.comments.flatMap(comment =>
        comment.replies?.flatMap(reply => reply.reactions.map(reaction => reaction.userId)) || []
      )
    );
    const userIds = [...new Set([...postUserIds, ...commentUserIds, ...replyUserIds, ...reactionUserIds, ...commentReactionUserIds, ...replyReactionUserIds])];

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

      // Group reactions by type with user info
      const reactionsByType = post.reactions.reduce((acc, reaction) => {
        if (!acc[reaction.reactionType]) {
          acc[reaction.reactionType] = [];
        }
        const reactionUser = userInfoMap[reaction.userId];
        if (reactionUser) {
          acc[reaction.reactionType].push({
            userId: reaction.userId,
            firstName: reactionUser.firstName,
            lastName: reactionUser.lastName,
            imageUrl: reactionUser.imageUrl,
            username: reactionUser.username,
            isAdmin: reactionUser.isAdmin,
          });
        }
        return acc;
      }, {} as Record<string, Array<{userId: string, firstName: string, lastName: string, imageUrl: string, username: string, isAdmin: boolean}>>);

      // Enhance comments with user info and reaction data, including replies
      const enhancedComments = post.comments.map(comment => {
        const userCommentReaction = comment.reactions.find(reaction =>
          reaction.userId === user.id
        );

        // Calculate comment reaction counts by type
        const commentReactionCounts = comment.reactions.reduce((acc, reaction) => {
          acc[reaction.reactionType] = (acc[reaction.reactionType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Enhance replies with user info and reaction data
        const enhancedReplies = (comment.replies || []).map(reply => {
          const userReplyReaction = reply.reactions.find(reaction =>
            reaction.userId === user.id
          );

          // Calculate reply reaction counts by type
          const replyReactionCounts = reply.reactions.reduce((acc, reaction) => {
            acc[reaction.reactionType] = (acc[reaction.reactionType] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          return {
            ...reply,
            author: userInfoMap[reply.userId] || {
              userId: reply.userId,
              firstName: "Unknown",
              lastName: "User",
              imageUrl: "",
              username: "Unknown",
            },
            reactionCounts: replyReactionCounts,
            userReaction: userReplyReaction ? {
              id: userReplyReaction.id,
              type: userReplyReaction.reactionType,
            } : null,
          };
        });

        return {
          ...comment,
          author: userInfoMap[comment.userId] || {
            userId: comment.userId,
            firstName: "Unknown",
            lastName: "User",
            imageUrl: "",
            username: "Unknown",
          },
          reactionCounts: commentReactionCounts,
          userReaction: userCommentReaction ? {
            id: userCommentReaction.id,
            type: userCommentReaction.reactionType,
          } : null,
          replies: enhancedReplies,
        };
      });

      return {
        ...post,
        author: userInfo,
        comments: enhancedComments,
        reactionCounts,
        reactionsByType,
        userReaction: userReaction ? {
          id: userReaction.id,
          type: userReaction.reactionType,
        } : null,
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    // Get challenge start date for day number calculation
    let challengeStartDate = null;
    if (whereClause.challengeId) {
      const challenge = await prisma.ninetyDayChallenge.findUnique({
        where: { id: whereClause.challengeId },
        select: { startDate: true }
      });
      challengeStartDate = challenge?.startDate || null;
    }

    return NextResponse.json({
      posts: enhancedPosts,
      totalPages,
      currentPage: page,
      totalCount,
      currentUserId: user.id,
      challengeStartDate: challengeStartDate,
    });
  } catch (error) {
    console.error("Error fetching community feed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}