import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs";
import PageHeading from "@/components/PageHeading/PageHeading";
import { ChallengeCalendar } from "./_components/ChallengeCalendar";
import { DailyPostForm } from "./_components/DailyPostForm";
import { ChallengeStats } from "./_components/ChallengeStats";
import { ChallengeSelection } from "./_components/ChallengeSelection";
import { ChallengeSelector } from "./_components/ChallengeSelector";
import prisma from "@/prisma/prisma";

async function getUserChallenges(userId: string) {
  try {
    // Get ALL challenges the user is enabled for
    const participants = await prisma.ninetyDayChallengeParticipant.findMany({
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
      orderBy: {
        challenge: {
          createdAt: 'desc' // Most recent challenges first
        }
      }
    });

    return {
      challenges: participants.map(p => ({
        id: p.challengeId,
        title: p.challenge.title,
        description: p.challenge.description,
        startDate: p.challenge.startDate,
        endDate: p.challenge.endDate,
      })),
      hasAccess: participants.length > 0,
      defaultChallenge: participants[0] ? {
        challengeId: participants[0].challengeId,
        challengeTitle: participants[0].challenge.title,
      } : null
    };
  } catch (error) {
    console.error("Error checking challenge access:", error);
    return { challenges: [], hasAccess: false, defaultChallenge: null };
  }
}

interface PageProps {
  searchParams: {
    challengeId?: string;
  };
}

export default async function NinetyDayChallengePage({ searchParams }: PageProps) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get user's challenges
  const userChallenges = await getUserChallenges(user.id);

  if (!userChallenges.hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">
            90-Day Challenge Not Available
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            You don't have access to the 90-day challenge yet. Contact an admin to get enabled.
          </p>
        </div>
      </div>
    );
  }

  // If user has multiple challenges and no specific challenge is selected, show selection
  if (userChallenges.challenges.length > 1 && !searchParams.challengeId) {
    return <ChallengeSelection challenges={userChallenges.challenges} />;
  }

  // Determine which challenge to show
  const selectedChallengeId = searchParams.challengeId || userChallenges.defaultChallenge?.challengeId;
  const selectedChallenge = userChallenges.challenges.find(c => c.id === selectedChallengeId) || userChallenges.challenges[0];

  if (!selectedChallenge) {
    redirect("/ninety-day-challenge");
  }

  return (
    <div className="space-y-6">
      {/* Challenge Header with Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <PageHeading title={selectedChallenge.title} />
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            {selectedChallenge.description || "Transform your life in 90 days"}
          </p>
        </div>
        <ChallengeSelector
          challenges={userChallenges.challenges}
          selectedChallengeId={selectedChallenge.id}
        />
      </div>

      {/* Challenge Overview */}
      <ChallengeStats challengeId={selectedChallenge.id} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar View */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
              Challenge Calendar
            </h2>
            <ChallengeCalendar challengeId={selectedChallenge.id} />
          </div>
        </div>

        {/* Daily Post Form */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">
            Today's Update
          </h2>
          <DailyPostForm challengeId={selectedChallenge.id} />
        </div>
      </div>

    </div>
  );
}