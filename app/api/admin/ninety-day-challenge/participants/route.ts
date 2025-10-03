import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/utils/adminAuth";
import prisma from "@/prisma/prisma";
import { clerkClient } from "@clerk/nextjs";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {

    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get("challengeId");

    const whereClause = challengeId ? { challengeId } : {};

    const participants = await prisma.ninetyDayChallengeParticipant.findMany({
      where: whereClause,
      include: {
        challenge: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    // Get user details from Clerk
    const participantsWithUserInfo = await Promise.all(
      participants.map(async (participant) => {
        try {
          const user = await clerkClient.users.getUser(participant.userId);
          return {
            ...participant,
            user: {
              firstName: user.firstName || "",
              lastName: user.lastName || "",
              email: user.emailAddresses[0]?.emailAddress || "",
              imageUrl: user.imageUrl || "",
            },
          };
        } catch (error) {
          console.error(`Error fetching user ${participant.userId}:`, error);
          return {
            ...participant,
            user: {
              firstName: "Unknown",
              lastName: "User",
              email: "unknown@example.com",
              imageUrl: "",
            },
          };
        }
      })
    );

    return NextResponse.json({ participants: participantsWithUserInfo });
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {

    const { userId, challengeId } = await request.json();

    if (!userId || !challengeId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if participant already exists
    const existingParticipant = await prisma.ninetyDayChallengeParticipant.findUnique({
      where: {
        userId_challengeId: {
          userId,
          challengeId,
        },
      },
    });

    if (existingParticipant) {
      return NextResponse.json({ error: "User is already a participant" }, { status: 400 });
    }

    const participant = await prisma.ninetyDayChallengeParticipant.create({
      data: {
        userId,
        challengeId,
        isEnabled: false, // Default to disabled until admin enables
      },
    });

    return NextResponse.json({ participant });
  } catch (error) {
    console.error("Error adding participant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}