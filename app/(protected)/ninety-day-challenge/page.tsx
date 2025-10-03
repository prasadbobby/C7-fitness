import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs";
import PageHeading from "@/components/PageHeading/PageHeading";
import { ChallengeCalendar } from "./_components/ChallengeCalendar";
import { DailyPostForm } from "./_components/DailyPostForm";
import { ChallengeStats } from "./_components/ChallengeStats";
import prisma from "@/prisma/prisma";

async function checkChallengeAccess(userId: string) {
  try {
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

    return {
      isEnabled: !!participant,
      challengeId: participant?.challengeId || null,
      challengeTitle: participant?.challenge.title || null,
    };
  } catch (error) {
    console.error("Error checking challenge access:", error);
    return { isEnabled: false };
  }
}

export default async function NinetyDayChallengePage() {
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
            90-Day Challenge Not Available
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            You don't have access to the 90-day challenge yet. Contact an admin to get enabled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeading title="90-Day Transformation Challenge" />

      {/* Challenge Overview */}
      <ChallengeStats />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar View */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
              Challenge Calendar
            </h2>
            <ChallengeCalendar />
          </div>
        </div>

        {/* Daily Post Form */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">
            Today's Update
          </h2>
          <DailyPostForm />
        </div>
      </div>
    </div>
  );
}