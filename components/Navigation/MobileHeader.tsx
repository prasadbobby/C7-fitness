"use client";

import Link from "next/link";
import { IconFlame, IconMenu2, IconX } from "@tabler/icons-react";
import { useSidebarToggleContext } from "@/contexts/SidebarToggleContext";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect, useRef } from "react";
import {
  calculateParticipantMetrics,
  calculateChallengeScore,
} from "@/utils/challengeScoring";
import { CheckmarkBadgeIcon, type CheckmarkBadgeIconHandle } from "@/components/UI/trophy-icon";
import { LeaderboardModal } from "@/app/(protected)/ninety-day-challenge/_components/LeaderboardModal";

export default function MobileHeader() {
  const { toggleMobileMenu, mobileMenuOpen } = useSidebarToggleContext();
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChallengeEnabled, setIsChallengeEnabled] = useState(false);
  const [userPoints, setUserPoints] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [challengeInfo, setChallengeInfo] = useState<{
    challengeId: string;
    title: string;
    startDate: string;
    endDate: string;
  } | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const checkmarkBadgeRef = useRef<CheckmarkBadgeIconHandle>(null);

  const handleMenuToggle = () => {
    toggleMobileMenu();
  };

  const handlePointsClick = () => {
    if (challengeInfo && user) {
      // Trigger checkmark badge animation
      checkmarkBadgeRef.current?.startAnimation();

      // Stop animation after completion
      setTimeout(() => {
        checkmarkBadgeRef.current?.stopAnimation();
      }, 600);

      // Open leaderboard modal
      setShowLeaderboard(true);
    }
  };

  useEffect(() => {
    async function checkUserStatusAndPoints() {
      if (user) {
        try {
          // Check admin status
          const adminResponse = await fetch('/api/admin/check-auth');
          const adminData = await adminResponse.json();
          setIsAdmin(adminData.isAdmin);

          // If not admin, check challenge access and get points
          if (!adminData.isAdmin) {
            const challengeResponse = await fetch('/api/ninety-day-challenge/check-access');

            if (challengeResponse.ok) {
              const challengeData = await challengeResponse.json();
              setIsChallengeEnabled(challengeData.isEnabled);

              // If challenge is enabled, get user points using weekly scoring
              if (challengeData.isEnabled) {
                try {
                  const infoResponse = await fetch('/api/ninety-day-challenge/info');

                  if (infoResponse.ok) {
                    const infoData = await infoResponse.json();

                    if (infoData.challengeId) {
                      // Store challenge info for leaderboard modal
                      setChallengeInfo({
                        challengeId: infoData.challengeId,
                        title: infoData.title,
                        startDate: infoData.startDate,
                        endDate: infoData.endDate,
                      });
                      // Get leaderboard data which contains the optimized post data
                      const leaderboardResponse = await fetch(`/api/ninety-day-challenge/leaderboard-optimized?challengeId=${infoData.challengeId}`);

                      if (leaderboardResponse.ok) {
                        const leaderboardData = await leaderboardResponse.json();

                        // Find current user in leaderboard data
                        const currentUserData = leaderboardData.participants?.find(
                          (participant: any) => participant.userId === user.id
                        );

                        if (currentUserData?.posts && currentUserData?.joinedAt) {
                          // Use overall scoring (same as leaderboard modal overall tab)
                          const metrics = calculateParticipantMetrics(currentUserData.posts, currentUserData.joinedAt);

                          // Calculate days elapsed for unified scoring (same as leaderboard)
                          const now = new Date();
                          const nowUTC = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
                          const joinedAtUTC = new Date(new Date(currentUserData.joinedAt).getUTCFullYear(), new Date(currentUserData.joinedAt).getUTCMonth(), new Date(currentUserData.joinedAt).getUTCDate());
                          const daysElapsed = Math.max(1, Math.ceil((nowUTC.getTime() - joinedAtUTC.getTime()) / (1000 * 60 * 60 * 24)));

                          // Calculate overall score using unified algorithm (same as leaderboard)
                          const score = calculateChallengeScore(metrics, daysElapsed);
                          setUserPoints(Math.round(score));
                        } else {
                          setUserPoints(0);
                        }
                      }
                    }
                  }
                } catch (error) {
                  console.error('Error fetching user points:', error);
                  setUserPoints(0);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error checking user status:', error);
          setIsAdmin(false);
          setIsChallengeEnabled(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    }
    checkUserStatusAndPoints();
  }, [user]);

  return (
    <>
      <header className="md:hidden bg-white dark:bg-zinc-900 shadow-sm z-[9997] relative">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left side: Hamburger + Logo */}
          <div className="flex items-center">
            {/* Hamburger Menu Button */}
            <button
              className="hamburger-button transition-transform duration-200 ease-in-out relative z-[10000] p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 mr-3"
              onClick={handleMenuToggle}
              aria-label="Toggle menu"
            >
              <div className={`transition-transform duration-200 ease-in-out ${mobileMenuOpen ? 'rotate-90' : 'rotate-0'}`}>
                {mobileMenuOpen ? <IconX size={24} /> : <IconMenu2 size={24} />}
              </div>
            </button>

            {/* Logo/Brand - Left aligned after hamburger */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-lg font-bold tracking-tight"
              aria-label="Home Page"
            >
              <div className="bg-primary rounded-b-lg p-1.5">
                <IconFlame className="text-black" size={24} />
              </div>
              <span className="text-[#a6ff00] font-bold">C7</span>
            </Link>
          </div>

          {/* Right side: User Points (only for non-admin users with challenge enabled) */}
          <div className="flex items-center">
            {!isAdmin && isChallengeEnabled && !isLoading && userPoints !== null && (
              <button
                onClick={handlePointsClick}
                className="flex items-center gap-1.5 bg-gradient-to-r from-primary/15 to-primary/10 dark:from-primary/25 dark:to-primary/15 px-2.5 py-1 rounded-xl border border-primary/30 shadow-sm hover:from-primary/20 hover:to-primary/15 dark:hover:from-primary/30 dark:hover:to-primary/20 transition-all duration-200 active:scale-95"
              >
                <span className="text-xs font-bold text-primary dark:text-primary tracking-wide">
                  {userPoints.toLocaleString()}
                </span>
                <CheckmarkBadgeIcon ref={checkmarkBadgeRef} size={14} className="text-primary dark:text-primary" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Leaderboard Modal */}
      {challengeInfo && user && (
        <LeaderboardModal
          isOpen={showLeaderboard}
          onClose={() => setShowLeaderboard(false)}
          challengeId={challengeInfo.challengeId}
          challengeTitle={challengeInfo.title}
          currentUserId={user.id}
          challengeStartDate={challengeInfo.startDate}
          challengeEndDate={challengeInfo.endDate}
        />
      )}
    </>
  );
}