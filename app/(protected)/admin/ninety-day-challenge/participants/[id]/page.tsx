import { redirect } from "next/navigation";
import { checkAdminAuth } from "@/utils/adminAuth";
import { clerkClient } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";
import PageHeading from "@/components/PageHeading/PageHeading";
import { ParticipantDetails } from "./_components/ParticipantDetails";
import { ParticipantPosts } from "./_components/ParticipantPosts";
import { ParticipantStats } from "./_components/ParticipantStats";

interface PageProps {
  params: { id: string };
}

async function getParticipantDetails(participantId: string) {
  try {
    const participant = await prisma.ninetyDayChallengeParticipant.findUnique({
      where: { id: participantId },
      include: {
        challenge: true,
        posts: {
          orderBy: { date: "desc" },
          take: 10,
        },
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    if (!participant) {
      return null;
    }

    // Get user details from Clerk
    let userInfo;
    try {
      const user = await clerkClient.users.getUser(participant.userId);
      userInfo = {
        firstName: user.firstName || "Unknown",
        lastName: user.lastName || "User",
        email: user.emailAddresses[0]?.emailAddress || "unknown@example.com",
        imageUrl: user.imageUrl || "",
        username: user.username || user.firstName || "Unknown",
      };
    } catch (error) {
      console.error(`Error fetching user ${participant.userId}:`, error);
      userInfo = {
        firstName: "Unknown",
        lastName: "User",
        email: "unknown@example.com",
        imageUrl: "",
        username: "Unknown",
      };
    }

    return {
      ...participant,
      user: userInfo,
    };
  } catch (error) {
    console.error("Error fetching participant details:", error);
    return null;
  }
}

export default async function ParticipantDetailsPage({ params }: PageProps) {
  const { isAdmin } = await checkAdminAuth();

  if (!isAdmin) {
    redirect("/");
  }

  const participant = await getParticipantDetails(params.id);

  if (!participant) {
    redirect("/admin/ninety-day-challenge");
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title={`${participant.user.firstName} ${participant.user.lastName}`}
        subtitle={`Participant in ${participant.challenge.title}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Participant Info */}
        <div className="lg:col-span-1 space-y-6">
          <ParticipantDetails participant={participant} />
          <ParticipantStats participant={participant} />
        </div>

        {/* Posts */}
        <div className="lg:col-span-2">
          <ParticipantPosts
            participantId={participant.id}
            userId={participant.userId}
            challengeId={participant.challengeId}
            challengeStartDate={participant.challenge.startDate}
          />
        </div>
      </div>
    </div>
  );
}