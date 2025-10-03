import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs";
import PageHeading from "@/components/PageHeading/PageHeading";
import { CommunityFeed } from "../ninety-day-challenge/_components/CommunityFeed";
import { CommunityHeader } from "./_components/CommunityHeader";
import prisma from "@/prisma/prisma";

async function checkChallengeAccess(userId: string) {
  try {
    // Check if user is admin
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId },
      select: { role: true }
    });

    const isAdmin = userInfo?.role === 'ADMIN' || userInfo?.role === 'SUPER_ADMIN';

    // Check if user is enabled for any active challenge
    const participant = await prisma.ninetyDayChallengeParticipant.findFirst({
      where: {
        userId: userId,
        isEnabled: true,
        challenge: {
          isActive: true,
        },
      },
      include: {
        challenge: true,
      },
    });

    // Admins have access even without being participants
    if (isAdmin) {
      const activeChallenge = await prisma.ninetyDayChallenge.findFirst({
        where: { isActive: true }
      });

      return {
        isEnabled: true,
        challengeId: participant?.challengeId || activeChallenge?.id || null,
        challengeTitle: participant?.challenge.title || activeChallenge?.title || "Active Challenge",
        isAdmin: true,
      };
    }

    return {
      isEnabled: !!participant,
      challengeId: participant?.challengeId || null,
      challengeTitle: participant?.challenge.title || null,
      isAdmin: false,
    };
  } catch (error) {
    console.error("Error checking challenge access:", error);
    return { isEnabled: false };
  }
}

export default async function CommunityPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Check if user has access to any active challenge
  const accessData = await checkChallengeAccess(user.id);

  if (!accessData.isEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">
            Community Access Not Available
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            You need to be part of an active 90-day challenge to access the community. Contact an admin to get enabled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CommunityHeader
        isAdmin={accessData.isAdmin}
        challengeId={accessData.challengeId}
      />

      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-800 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-2M3 4h12v8H7l-4 4V4z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
              Welcome to the Community!
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Share your progress, motivate others, and celebrate achievements together. React to posts to show your support!
            </p>
          </div>
        </div>
      </div>

      <CommunityFeed />
    </div>
  );
}