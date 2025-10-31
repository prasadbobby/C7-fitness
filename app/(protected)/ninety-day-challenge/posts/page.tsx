import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs";
import PageHeading from "@/components/PageHeading/PageHeading";
import { IconChevronRight } from "@tabler/icons-react";
import Link from "next/link";
import prisma from "@/prisma/prisma";
import { PostsClientWrapper } from "./_components/PostsClientWrapper";

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: {
    challengeId?: string;
  };
}

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

export default async function PostsDashboardPage({ searchParams }: PageProps) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const requestedChallengeId = searchParams.challengeId;

  // Check if user is admin
  const userInfo = await prisma.userInfo.findUnique({
    where: { userId: user.id },
    select: { role: true }
  });

  const isAdmin = userInfo?.role === 'ADMIN' || userInfo?.role === 'SUPER_ADMIN';

  // If a specific challengeId is requested and user is admin, use that
  let accessData;
  let challengeTitle = "";

  if (requestedChallengeId && isAdmin) {
    // Admin accessing specific challenge
    const challenge = await prisma.ninetyDayChallenge.findUnique({
      where: { id: requestedChallengeId },
      select: { id: true, title: true, isActive: true }
    });

    if (challenge) {
      accessData = {
        isEnabled: true,
        challengeId: challenge.id,
        challengeTitle: challenge.title
      };
      challengeTitle = challenge.title;
    } else {
      accessData = { isEnabled: false };
    }
  } else {
    // Regular user or admin without specific challenge
    accessData = await checkChallengeAccess(user.id);
    challengeTitle = accessData.challengeTitle || "";
  }

  if (!accessData.isEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">
            Community Posts Not Available
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            You don't have access to community posts yet. Contact an admin to get enabled for the challenges.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-foreground-500">
        {requestedChallengeId && isAdmin ? (
          // Admin flow
          <>
            <Link href="/admin" className="hover:text-foreground-700">
              Admin
            </Link>
            <IconChevronRight size={16} />
            <Link href="/admin/ninety-day-challenge" className="hover:text-foreground-700">
              Challenge Management
            </Link>
            <IconChevronRight size={16} />
            <Link href={`/admin/ninety-day-challenge/challenges/${requestedChallengeId}`} className="hover:text-foreground-700">
              {challengeTitle}
            </Link>
            <IconChevronRight size={16} />
            <span className="text-foreground-900 font-medium">Community Posts</span>
          </>
        ) : (
          // User flow
          <>
            <Link href="/ninety-day-challenge" className="hover:text-foreground-700">
              Challenges
            </Link>
            <IconChevronRight size={16} />
            <span className="text-foreground-900 font-medium">Community Posts</span>
          </>
        )}
      </nav>

      {/* Header - Mobile First */}
      <div className="space-y-3">
        <PageHeading title="Community Posts" />
        <p className="text-foreground-600 text-sm leading-relaxed">
          {challengeTitle} - Community discussions and daily updates
        </p>
      </div>

      {/* Community Guidelines - Mobile First */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl overflow-hidden">
        {/* Header Section */}
        <div className="flex items-center gap-3 p-4 border-b border-divider bg-content2/50">
          <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-2M3 4h12v8H7l-4 4V4z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            Community Guidelines
          </h3>
        </div>

        {/* Guidelines Content */}
        <div className="p-4 space-y-3">
          <div className="space-y-2">
            <div className="flex items-start gap-3 text-sm">
              <span className="text-foreground-500 font-medium mt-0.5">•</span>
              <span className="text-foreground-700 leading-relaxed">Be supportive and encouraging to fellow participants</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <span className="text-foreground-500 font-medium mt-0.5">•</span>
              <span className="text-foreground-700 leading-relaxed">Share your genuine experiences and progress</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <span className="text-foreground-500 font-medium mt-0.5">•</span>
              <span className="text-foreground-700 leading-relaxed">Celebrate others' achievements and milestones</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <span className="text-foreground-500 font-medium mt-0.5">•</span>
              <span className="text-foreground-700 leading-relaxed">Keep discussions positive and motivational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Community Feed with Admin Post Modal */}
      <PostsClientWrapper
        challengeId={accessData.challengeId || null}
        challengeTitle={challengeTitle}
        isAdmin={isAdmin}
        showTodayByDefault={true}
      />
    </div>
  );
}