"use client";

import { useState, useEffect, Suspense, lazy } from "react";
import { useRouter } from "next/navigation";

// Lazy load heavy components for better initial load performance
const ChallengeDetails = lazy(() => import("./_components/ChallengeDetails").then(module => ({ default: module.ChallengeDetails })));
const ParticipantLeaderboard = lazy(() => import("./_components/ParticipantLeaderboard").then(module => ({ default: module.ParticipantLeaderboard })));
const WeeklyLeaderboard = lazy(() => import("./_components/WeeklyLeaderboard").then(module => ({ default: module.WeeklyLeaderboard })));
const ChallengeAnalytics = lazy(() => import("./_components/ChallengeAnalytics").then(module => ({ default: module.ChallengeAnalytics })));
const AddParticipantModal = lazy(() => import("./_components/AddParticipantModal").then(module => ({ default: module.AddParticipantModal })));
import { Card, CardHeader, CardBody } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { Chip } from "@nextui-org/chip";
import { Progress } from "@nextui-org/react";
import { JoinRequests } from "../../_components/JoinRequests";
import {
  IconTrophy,
  IconChartBar,
  IconUsers,
  IconCalendarEvent,
  IconUserPlus,
  IconMessageCircle,
  IconChevronRight,
  IconCalendarWeek,
  IconRefresh,
} from "@tabler/icons-react";
import Link from "next/link";
import { ConfirmationModal } from "@/components/UI/ConfirmationModal";

interface PageProps {
  params: { id: string };
}

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  participants: any[];
  _count: {
    participants: number;
  };
}

export default function ChallengeDashboardPage({ params }: PageProps) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddParticipantModalOpen, setIsAddParticipantModalOpen] = useState(false);
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<"overall" | "weekly">("overall");
  const [clearingScores, setClearingScores] = useState(false);
  const [showClearScoresModal, setShowClearScoresModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchChallengeData();
  }, [params.id]);

  const fetchChallengeData = async () => {
    try {
      setLoading(true);
      console.log('Fetching challenge data for ID:', params.id);
      // Fetch with photos for leaderboard calculations, limit to recent 30 posts per participant for better performance
      const response = await fetch(`/api/admin/ninety-day-challenge/challenges/${params.id}?includePhotos=false&limit=30&_t=${Date.now()}`, {
        cache: 'no-store' // Don't cache when scores might have been reset
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Challenge data received:', {
          challengeId: data.challenge.id,
          participantCount: data.challenge.participants.length,
          participants: data.challenge.participants.map((p: any) => ({
            id: p.id,
            userId: p.userId,
            isEnabled: p.isEnabled,
            name: `${p.user.firstName} ${p.user.lastName}`
          }))
        });
        setChallenge(data.challenge);
      } else if (response.status === 404) {
        router.push("/admin/ninety-day-challenge");
      }
    } catch (error) {
      console.error('Error fetching challenge data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleParticipantAdded = () => {
    console.log('Participant added, refreshing challenge data...');
    fetchChallengeData(); // Refresh the data
  };

  const handleClearScoresClick = () => {
    setShowClearScoresModal(true);
  };

  const handleClearScoresConfirm = async () => {
    if (!challenge) return;

    setShowClearScoresModal(false);

    try {
      setClearingScores(true);
      console.log('Clearing scores for challenge:', challenge.id);

      const response = await fetch(`/api/admin/ninety-day-challenge/challenges/${challenge.id}/reset-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Success!\n\n${data.message}\n\nParticipants updated: ${data.participantsUpdated}`);

        // Refresh the challenge data to show updated scores
        await fetchChallengeData();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to clear scores'}`);
      }
    } catch (error) {
      console.error('Error clearing scores:', error);
      alert('Error: Failed to clear scores. Please try again.');
    } finally {
      setClearingScores(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-foreground-500">Loading challenge data...</p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="text-center py-8">
        <p className="text-foreground-500">Challenge not found.</p>
      </div>
    );
  }

  // Use UTC dates for consistent calculations across timezones
  const now = new Date();
  const nowUTC = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const startDateUTC = new Date(new Date(challenge.startDate).getUTCFullYear(), new Date(challenge.startDate).getUTCMonth(), new Date(challenge.startDate).getUTCDate());
  const endDateUTC = new Date(new Date(challenge.endDate).getUTCFullYear(), new Date(challenge.endDate).getUTCMonth(), new Date(challenge.endDate).getUTCDate());

  // Calculate dynamic challenge duration
  const totalDays = Math.ceil((endDateUTC.getTime() - startDateUTC.getTime()) / (1000 * 60 * 60 * 24));

  const daysRemaining = Math.max(0, Math.ceil((endDateUTC.getTime() - nowUTC.getTime()) / (1000 * 60 * 60 * 24)));
  const daysElapsed = Math.max(0, Math.ceil((nowUTC.getTime() - startDateUTC.getTime()) / (1000 * 60 * 60 * 24)));
  const progressPercentage = Math.min(100, totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-foreground-500">
        <Link href="/admin" className="hover:text-foreground-700">
          Admin
        </Link>
        <IconChevronRight size={16} />
        <Link href="/admin/ninety-day-challenge" className="hover:text-foreground-700">
          Challenge Management
        </Link>
        <IconChevronRight size={16} />
        <span className="text-foreground-900 font-medium">
          {challenge?.title || 'Challenge Details'}
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">{challenge.title}</h1>
            <Chip size="sm" variant="flat" color={daysRemaining === 0 ? "default" : challenge.isActive ? "success" : "warning"}>
              {daysRemaining === 0 ? "Finished" : challenge.isActive ? "Live" : "Paused"}
            </Chip>
          </div>
          <p className="text-sm text-foreground-500 mt-1">
            {new Date(challenge.startDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} – {new Date(challenge.endDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="flat" startContent={<IconUserPlus size={18} />} onPress={() => setIsAddParticipantModalOpen(true)}>
            Add participant
          </Button>
          <Button as={Link} href={`/ninety-day-challenge/posts?challengeId=${challenge.id}`} variant="flat" startContent={<IconMessageCircle size={18} />}>
            All posts
          </Button>
          <Button color="danger" variant="light" startContent={<IconRefresh size={18} />} onPress={handleClearScoresClick} isLoading={clearingScores}>
            Reset scores
          </Button>
        </div>
      </div>

      {/* Overview */}
      <Card shadow="none" className="border border-divider">
        <CardBody className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Participants", value: challenge._count.participants },
              { label: "Day", value: `${Math.min(daysElapsed, totalDays)} / ${totalDays}` },
              { label: "Elapsed", value: `${Math.round(progressPercentage)}%` },
              { label: "Days left", value: daysRemaining },
            ].map((t) => (
              <div key={t.label}>
                <p className="text-xs text-foreground-500">{t.label}</p>
                <p className="text-2xl font-semibold text-foreground mt-1">{t.value}</p>
              </div>
            ))}
          </div>
          <Progress aria-label="Challenge timeline" size="sm" value={progressPercentage} color="primary" className="mt-4" />
        </CardBody>
      </Card>

      <JoinRequests challengeId={challenge.id} compact onChange={() => window.location.reload()} />

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Participant Leaderboard */}
        <div className="xl:col-span-1">
          <Card shadow="none" className="bg-content1 border border-divider h-full">
            <CardHeader className="flex items-center gap-4 pb-4">
              <div className="p-3 bg-content1 rounded-xl">
                <IconTrophy className="w-6 h-6 text-warning" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Leaderboards
                </h2>
                <p className="text-sm text-foreground-500">
                  Overall & weekly rankings
                </p>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {/* Custom Tab Implementation */}
              <div className="w-full">
                {/* Tab Headers */}
                <div className="flex border-b border-divider px-6 bg-content1">
                  <button
                    onClick={() => setActiveLeaderboardTab("overall")}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 hover:text-primary ${
                      activeLeaderboardTab === "overall"
                        ? "border-primary text-primary bg-primary/5"
                        : "border-transparent text-foreground-500 hover:text-foreground"
                    }`}
                    aria-label="View overall leaderboard"
                  >
                    <IconTrophy size={16} aria-hidden="true" />
                    <span className="font-medium">Overall</span>
                  </button>
                  <button
                    onClick={() => setActiveLeaderboardTab("weekly")}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 hover:text-primary ${
                      activeLeaderboardTab === "weekly"
                        ? "border-primary text-primary bg-primary/5"
                        : "border-transparent text-foreground-500 hover:text-foreground"
                    }`}
                    aria-label="View weekly leaderboard"
                  >
                    <IconCalendarWeek size={16} aria-hidden="true" />
                    <span className="font-medium">Weekly</span>
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  <Suspense fallback={<div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
                    {activeLeaderboardTab === "overall" && (
                      <ParticipantLeaderboard participants={challenge.participants} />
                    )}
                    {activeLeaderboardTab === "weekly" && (
                      <WeeklyLeaderboard
                        participants={challenge.participants}
                        challengeStartDate={challenge.startDate}
                        challengeEndDate={challenge.endDate}
                      />
                    )}
                  </Suspense>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Challenge Analytics */}
        <div className="xl:col-span-2">
          <Card shadow="none" className="bg-content1 border border-divider h-full">
            <CardHeader className="flex items-center gap-4 pb-4">
              <div className="p-3 bg-content1 rounded-xl">
                <IconChartBar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Challenge Analytics
                </h2>
                <p className="text-sm text-foreground-500">
                  Detailed insights and trends
                </p>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <Suspense fallback={<div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
                <ChallengeAnalytics challenge={challenge} />
              </Suspense>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Challenge Details */}
      <Card shadow="none" className="bg-content1 border border-divider">
        <CardHeader className="flex items-center gap-4 pb-4">
          <div className="p-3 bg-content1 rounded-xl">
            <IconUsers className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Participant Details
            </h2>
            <p className="text-sm text-foreground-500">
              Complete participant list and individual progress
            </p>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <Suspense fallback={<div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
            <ChallengeDetails challenge={challenge} />
          </Suspense>
        </CardBody>
      </Card>


      {/* Add Participant Modal */}
      <Suspense fallback={null}>
        <AddParticipantModal
          isOpen={isAddParticipantModalOpen}
          onClose={() => setIsAddParticipantModalOpen(false)}
          challengeId={challenge.id}
          onParticipantAdded={handleParticipantAdded}
        />
      </Suspense>

      {/* Clear Scores Confirmation Modal */}
      <ConfirmationModal
        isOpen={showClearScoresModal}
        onClose={() => setShowClearScoresModal(false)}
        onConfirm={handleClearScoresConfirm}
        title="Clear All Scores"
        message={
          <div className="space-y-3">
            <p>Are you sure you want to clear all scores for <strong>"{challenge?.title}"</strong>?</p>
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-warning-600">
                <strong>What this does:</strong>
              </p>
              <ul className="text-sm text-warning-600 mt-1 space-y-1">
                <li>• Resets all participant points to 0</li>
                <li>• Scoring will restart from today's date</li>
                <li>• All posts remain intact</li>
                <li>• Only future posts will count toward scores</li>
              </ul>
            </div>
          </div>
        }
        confirmText="Clear Scores"
        confirmColor="danger"
        isLoading={clearingScores}
        destructive={true}
      />
    </div>
  );
}