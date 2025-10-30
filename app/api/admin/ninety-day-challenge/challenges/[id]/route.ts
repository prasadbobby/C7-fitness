import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/utils/adminAuth";
import prisma from "@/prisma/prisma";

export const dynamic = 'force-dynamic';

// Cache user data for 5 minutes to reduce Clerk API calls
const userCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedUser(userId: string) {
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCachedUser(userId: string, data: any) {
  userCache.set(userId, { data, timestamp: Date.now() });
}

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
    // Check if this is a request for photos specifically
    const url = new URL(request.url);
    const includePhotos = url.searchParams.get('includePhotos') === 'true';
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 50; // Default limit to prevent massive queries

    // Get challenge with participants - optimized with proper limits
    const challenge = await prisma.ninetyDayChallenge.findUnique({
      where: { id: params.id },
      include: {
        participants: {
          where: { isEnabled: true },
          include: {
            posts: {
              select: {
                id: true, // Need ID for photo count lookup
                date: true,
                sleepHours: true,
                sleepQuality: true,
                mood: true,
                energy: true,
                isFasting: true, // Required for photo scoring calculation
                // Exclude photos to avoid massive data transfer - we'll get counts separately
                createdAt: true,
              },
              orderBy: { date: 'desc' }, // Most recent first
              take: limit // Always apply limit to prevent massive data transfer
            }
          }
        },
        _count: {
          select: {
            participants: {
              where: { isEnabled: true }
            }
          }
        }
      }
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Get user roles to filter out admins - optimized single query
    const userIds = challenge.participants.map(p => p.userId);
    const userRoles = await prisma.userInfo.findMany({
      where: {
        userId: { in: userIds }
      },
      select: {
        userId: true,
        role: true
      }
    });

    // Create role lookup map for O(1) access
    const roleMap = new Map();
    userRoles.forEach(userRole => {
      roleMap.set(userRole.userId, userRole.role);
    });

    // Filter out admin participants (exclude ADMIN and SUPER_ADMIN from leaderboard)
    const nonAdminParticipants = challenge.participants.filter(participant => {
      const role = roleMap.get(participant.userId);
      return role !== 'ADMIN' && role !== 'SUPER_ADMIN';
    });

    // Get photo counts efficiently without transferring photo data
    const allPostIds = nonAdminParticipants.flatMap(participant =>
      participant.posts.map(post => post.id)
    );

    let photoCountMap = new Map<string, number>();

    if (allPostIds.length > 0) {
      // Use raw SQL to get photo counts efficiently
      const photoCounts = await prisma.$queryRaw<Array<{id: string, photo_count: number}>>`
        SELECT id, COALESCE(array_length(photos, 1), 0) as photo_count
        FROM "NinetyDayChallengePost"
        WHERE id = ANY(${allPostIds})
      `;

      // Create photo count lookup map
      photoCounts.forEach(result => {
        photoCountMap.set(result.id, result.photo_count || 0);
      });
    }

    // Fetch user data from Clerk for non-admin participants only with caching
    const { clerkClient } = await import("@clerk/nextjs");
    const nonAdminUserIds = nonAdminParticipants.map(p => p.userId);

    // Check cache first
    const cachedUsers = new Map();
    const uncachedUserIds: string[] = [];

    nonAdminUserIds.forEach(userId => {
      const cached = getCachedUser(userId);
      if (cached) {
        cachedUsers.set(userId, cached);
      } else {
        uncachedUserIds.push(userId);
      }
    });

    let newUsers: any[] = [];

    // Only fetch uncached users
    if (uncachedUserIds.length > 0) {
      try {
        // Batch fetch users for better performance
        const batchResponse = await clerkClient.users.getUserList({
          userId: uncachedUserIds,
          limit: 100 // Clerk API limit
        });
        newUsers = batchResponse;

        // Cache the new users
        newUsers.forEach(user => {
          if (user) {
            setCachedUser(user.id, user);
          }
        });
      } catch (error) {
        console.error("Error batch fetching users:", error);
        // Fallback to individual fetches if batch fails
        newUsers = await Promise.all(
          uncachedUserIds.map(async (userId) => {
            try {
              const user = await clerkClient.users.getUser(userId);
              if (user) {
                setCachedUser(userId, user);
              }
              return user;
            } catch (err) {
              console.error(`Error fetching user ${userId}:`, err);
              return null;
            }
          })
        );
      }
    }

    // Combine cached and new users
    const allUsers = [...Array.from(cachedUsers.values()), ...newUsers.filter(Boolean)];

    // Create user lookup map for O(1) access
    const userMap = new Map();
    allUsers.forEach(user => {
      userMap.set(user.id, user);
    });

    const enhancedParticipants = nonAdminParticipants.map((participant) => {
      const user = userMap.get(participant.userId);

      // Transform posts to include photoCount for scoring from our efficient lookup
      const transformedPosts = participant.posts.map((post: any) => ({
        ...post,
        photoCount: photoCountMap.get(post.id) || 0, // Get photo count from our efficient lookup
        // Photos are excluded from main query for performance - only counts are included
      }));

      if (user) {
        return {
          ...participant,
          posts: transformedPosts, // Use transformed posts with photoCount
          user: {
            firstName: user.firstName || "Unknown",
            lastName: user.lastName || "User",
            imageUrl: user.imageUrl || "",
            email: user.emailAddresses?.[0]?.emailAddress || "",
            username: user.username || user.firstName || "Unknown"
          }
        };
      } else {
        return {
          ...participant,
          posts: transformedPosts, // Use transformed posts with photoCount
          user: {
            firstName: "Unknown",
            lastName: "User",
            imageUrl: "",
            email: "unknown@example.com",
            username: "Unknown"
          }
        };
      }
    });

    const enhancedChallenge = {
      ...challenge,
      participants: enhancedParticipants,
      _count: {
        ...challenge._count,
        participants: enhancedParticipants.length // Update count to reflect non-admin participants only
      }
    };

    const response = NextResponse.json({
      challenge: enhancedChallenge
    });

    // Add cache headers for better performance
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    response.headers.set('Vary', 'Accept-Encoding');

    return response;
  } catch (error) {
    console.error('Error fetching challenge:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}