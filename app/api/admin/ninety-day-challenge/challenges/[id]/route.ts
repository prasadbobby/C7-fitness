import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/utils/adminAuth";
import prisma from "@/prisma/prisma";

export const dynamic = 'force-dynamic';

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
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined;

    const challenge = await prisma.ninetyDayChallenge.findUnique({
      where: { id: params.id },
      include: {
        participants: {
          where: { isEnabled: true },
          include: {
            posts: {
              select: {
                date: true,
                sleepHours: true,
                sleepQuality: true,
                mood: true,
                energy: true,
                isFasting: true, // Required for photo scoring calculation
                // Only include photos if explicitly requested
                ...(includePhotos && { photos: true }),
                createdAt: true,
              },
              orderBy: { date: 'desc' }, // Most recent first
              // Apply limit if specified
              ...(limit && { take: limit })
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

    // Get user roles from database to filter out admins
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

    // Create role lookup map
    const roleMap = new Map();
    userRoles.forEach(userRole => {
      roleMap.set(userRole.userId, userRole.role);
    });

    // Filter out admin participants (exclude ADMIN and SUPER_ADMIN from leaderboard)
    const nonAdminParticipants = challenge.participants.filter(participant => {
      const role = roleMap.get(participant.userId);
      return role !== 'ADMIN' && role !== 'SUPER_ADMIN';
    });

    // Fetch user data from Clerk for non-admin participants only (optimized batch fetch)
    const { clerkClient } = await import("@clerk/nextjs");
    const nonAdminUserIds = nonAdminParticipants.map(p => p.userId);
    let users: any[] = [];

    try {
      // Batch fetch users for better performance
      if (nonAdminUserIds.length > 0) {
        const batchResponse = await clerkClient.users.getUserList({
          userId: nonAdminUserIds,
          limit: 100 // Clerk API limit
        });
        users = batchResponse;
      }
    } catch (error) {
      console.error("Error batch fetching users:", error);
      // Fallback to individual fetches if batch fails
      users = await Promise.all(
        nonAdminUserIds.map(async (userId) => {
          try {
            return await clerkClient.users.getUser(userId);
          } catch (err) {
            console.error(`Error fetching user ${userId}:`, err);
            return null;
          }
        })
      );
    }

    // Create user lookup map for O(1) access
    const userMap = new Map();
    users.filter(Boolean).forEach(user => {
      userMap.set(user.id, user);
    });

    const enhancedParticipants = nonAdminParticipants.map((participant) => {
      const user = userMap.get(participant.userId);

      if (user) {
        return {
          ...participant,
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

    return NextResponse.json({
      challenge: enhancedChallenge
    });
  } catch (error) {
    console.error('Error fetching challenge:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}