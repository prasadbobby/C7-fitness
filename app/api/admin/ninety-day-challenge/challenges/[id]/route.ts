import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/utils/adminAuth";
import prisma from "@/prisma/prisma";

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

    // Fetch user data from Clerk for all participants
    const { clerkClient } = await import("@clerk/nextjs");
    const enhancedParticipants = await Promise.all(
      challenge.participants.map(async (participant) => {
        try {
          const user = await clerkClient.users.getUser(participant.userId);
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
        } catch (error) {
          console.error(`Error fetching user ${participant.userId}:`, error);
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
      })
    );

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