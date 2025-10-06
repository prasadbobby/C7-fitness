import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/utils/adminAuth";
import prisma from "@/prisma/prisma";
import { clerkClient } from "@clerk/nextjs";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get("challengeId");
    const cleanup = searchParams.get("cleanup") === "true";

    // If cleanup is requested, perform comprehensive cleanup first
    if (cleanup) {
      await performComprehensiveCleanup();
    }

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

    // Get user details from Clerk and filter out deleted users
    const participantsWithUserInfo = [];
    const orphanedParticipants = [];

    for (const participant of participants) {
      try {
        const user = await clerkClient.users.getUser(participant.userId);
        participantsWithUserInfo.push({
          ...participant,
          user: {
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.emailAddresses[0]?.emailAddress || "",
            imageUrl: user.imageUrl || "",
          },
        });
      } catch (error) {
        console.error(`User ${participant.userId} not found in Clerk, marking for cleanup:`, error);
        orphanedParticipants.push(participant.id);
      }
    }

    // Clean up orphaned participants in batch
    if (orphanedParticipants.length > 0) {
      try {
        const deletedCount = await cleanupOrphanedParticipants(orphanedParticipants);
        console.log(`Cleaned up ${deletedCount} orphaned participant records`);
      } catch (cleanupError) {
        console.error("Failed to cleanup orphaned participants:", cleanupError);
      }
    }

    return NextResponse.json({
      participants: participantsWithUserInfo,
      cleanedUp: orphanedParticipants.length
    });
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper function to clean up orphaned participants and related data
async function cleanupOrphanedParticipants(participantIds: string[]) {
  return await prisma.$transaction(async (tx) => {
    // Delete related comments first
    await tx.ninetyDayChallengeComment.deleteMany({
      where: {
        participantId: {
          in: participantIds
        }
      }
    });

    // Delete related posts
    await tx.ninetyDayChallengePost.deleteMany({
      where: {
        participantId: {
          in: participantIds
        }
      }
    });

    // Finally delete the participants
    const result = await tx.ninetyDayChallengeParticipant.deleteMany({
      where: {
        id: {
          in: participantIds
        }
      }
    });

    return result.count;
  });
}

// Comprehensive cleanup function
async function performComprehensiveCleanup() {
  console.log("Performing comprehensive cleanup of orphaned records...");

  // Get all participants
  const allParticipants = await prisma.ninetyDayChallengeParticipant.findMany({
    select: {
      id: true,
      userId: true
    }
  });

  const orphanedParticipants = [];

  // Check each participant against Clerk
  for (const participant of allParticipants) {
    try {
      await clerkClient.users.getUser(participant.userId);
    } catch (error) {
      // User doesn't exist in Clerk, mark as orphaned
      orphanedParticipants.push(participant.id);
    }
  }

  if (orphanedParticipants.length > 0) {
    const cleanedCount = await cleanupOrphanedParticipants(orphanedParticipants);
    console.log(`Comprehensive cleanup removed ${cleanedCount} orphaned participants`);
  }

  return orphanedParticipants.length;
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    console.error('Admin authorization failed:', error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    console.log('Received request body:', body);

    const { userId, challengeId } = body;

    if (!userId || !challengeId) {
      console.error('Missing required fields:', { userId, challengeId });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log('Adding participant:', { userId, challengeId });

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
      console.log('Participant already exists:', existingParticipant);

      // If participant exists but is disabled, enable them instead of returning error
      if (!existingParticipant.isEnabled) {
        console.log('Enabling existing disabled participant...');
        const enabledParticipant = await prisma.ninetyDayChallengeParticipant.update({
          where: {
            id: existingParticipant.id,
          },
          data: {
            isEnabled: true,
          },
        });
        console.log('Participant enabled successfully:', enabledParticipant);
        return NextResponse.json({
          participant: enabledParticipant,
          message: "Participant was already in challenge and has been enabled"
        });
      } else {
        return NextResponse.json({ error: "User is already an active participant" }, { status: 400 });
      }
    }

    console.log('Creating new participant...');
    const participant = await prisma.ninetyDayChallengeParticipant.create({
      data: {
        userId,
        challengeId,
        isEnabled: true, // Enable by default when admin adds them
      },
    });

    console.log('Participant created successfully:', participant);
    return NextResponse.json({
      participant,
      message: "Participant has been added to the challenge successfully"
    });
  } catch (error) {
    console.error("Error adding participant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}