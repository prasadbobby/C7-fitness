import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs";
import PageHeading from "@/components/PageHeading/PageHeading";
import { Button } from "@nextui-org/button";
import { IconArrowLeft, IconChevronRight } from "@tabler/icons-react";
import Link from "next/link";
import prisma from "@/prisma/prisma";
import { PostsClientWrapper } from "./_components/PostsClientWrapper";

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
            You don't have access to community posts yet. Contact an admin to get enabled for the 90-day challenge.
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
              90-Day Challenge
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
              90-Day Challenge
            </Link>
            <IconChevronRight size={16} />
            <span className="text-foreground-900 font-medium">Community Posts</span>
          </>
        )}
      </nav>

      {/* Header */}
      <div>
        <PageHeading title="Community Posts" />
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          {challengeTitle} - Community discussions and daily updates
        </p>
      </div>

      {/* Community Guidelines */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-lg p-6">
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
              Community Guidelines
            </h3>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              <ul className="space-y-1">
                <li>• Be supportive and encouraging to fellow participants</li>
                <li>• Share your genuine experiences and progress</li>
                <li>• Celebrate others' achievements and milestones</li>
                <li>• Keep discussions positive and motivational</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Community Feed with Admin Post Modal */}
      <PostsClientWrapper
        challengeId={accessData.challengeId}
        challengeTitle={challengeTitle}
        isAdmin={isAdmin}
        showTodayByDefault={true}
      />
    </div>
  );
}