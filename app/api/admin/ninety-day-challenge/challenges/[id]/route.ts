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
                createdAt: true,
              },
              orderBy: { date: 'asc' }
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

    // Fetch user data from Clerk for all participants (optimized batch fetch)
    const { clerkClient } = await import("@clerk/nextjs");
    const userIds = challenge.participants.map(p => p.userId);
    let users: any[] = [];

    try {
      // Batch fetch users for better performance
      if (userIds.length > 0) {
        const batchResponse = await clerkClient.users.getUserList({
          userId: userIds,
          limit: 100 // Clerk API limit
        });
        users = batchResponse;
      }
    } catch (error) {
      console.error("Error batch fetching users:", error);
      // Fallback to individual fetches if batch fails
      users = await Promise.all(
        userIds.map(async (userId) => {
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

    const enhancedParticipants = challenge.participants.map((participant) => {
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
      participants: enhancedParticipants
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