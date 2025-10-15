import { NextResponse } from "next/server";
import { currentUser, clerkClient } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get('challengeId');

    if (!challengeId) {
      return NextResponse.json({ error: "Challenge ID is required" }, { status: 400 });
    }

    // Verify user has access to this challenge
    const userParticipation = await prisma.ninetyDayChallengeParticipant.findFirst({
      where: {
        userId: user.id,
        challengeId: challengeId,
        isEnabled: true,
        challenge: {
          isActive: true,
        },
      },
    });

    if (!userParticipation) {
      return NextResponse.json({ error: "Access denied to this challenge" }, { status: 403 });
    }

    // Get all participants and their posts for this challenge
    const participants = await prisma.ninetyDayChallengeParticipant.findMany({
      where: {
        challengeId: challengeId,
        isEnabled: true,
        challenge: {
          isActive: true,
        },
      },
      include: {
        challenge: true,
        posts: {
          where: {
            challengeId: challengeId,
          },
          orderBy: {
            date: 'desc'
          }
        },
      },
    });

    // Get user roles to filter out admins
    const userRoles = await prisma.userInfo.findMany({
      where: {
        userId: { in: participants.map(p => p.userId) }
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
    const nonAdminParticipants = participants.filter(participant => {
      const role = roleMap.get(participant.userId);
      return role !== 'ADMIN' && role !== 'SUPER_ADMIN';
    });

    // Fetch user information from Clerk for non-admin participants only
    const participantsWithUserInfo = await Promise.all(
      nonAdminParticipants.map(async (participant) => {
        try {
          const clerkUser = await clerkClient.users.getUser(participant.userId);
          return {
            ...participant,
            user: {
              firstName: clerkUser.firstName || '',
              lastName: clerkUser.lastName || '',
              imageUrl: clerkUser.imageUrl || '',
              email: clerkUser.emailAddresses[0]?.emailAddress || '',
              username: clerkUser.username || '',
            }
          };
        } catch (error) {
          console.error(`Error fetching user ${participant.userId}:`, error);
          return {
            ...participant,
            user: {
              firstName: 'Unknown',
              lastName: 'User',
              imageUrl: '',
              email: '',
              username: '',
            }
          };
        }
      })
    );

    return NextResponse.json({
      participants: participantsWithUserInfo,
      challengeTitle: nonAdminParticipants[0]?.challenge?.title || "Challenge",
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}