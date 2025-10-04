"use client";

import { useState, useEffect } from "react";
import { redirect, useRouter } from "next/navigation";
import { ChallengeDetails } from "./_components/ChallengeDetails";
import { ParticipantLeaderboard } from "./_components/ParticipantLeaderboard";
import { ChallengeAnalytics } from "./_components/ChallengeAnalytics";
import { AddParticipantModal } from "./_components/AddParticipantModal";
import { ChallengeCommunity } from "./_components/ChallengeCommunity";
import { Card, CardHeader, CardBody } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { Chip } from "@nextui-org/chip";
import {
  IconArrowLeft,
  IconTrophy,
  IconChartBar,
  IconUsers,
  IconCalendarEvent,
  IconUserPlus,
} from "@tabler/icons-react";
import Link from "next/link";

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
  const router = useRouter();

  useEffect(() => {
    fetchChallengeData();
  }, [params.id]);

  const fetchChallengeData = async () => {
    try {
      setLoading(true);
      console.log('Fetching challenge data for ID:', params.id);
      const response = await fetch(`/api/admin/ninety-day-challenge/challenges/${params.id}?t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Challenge data received:', {
          challengeId: data.challenge.id,
          participantCount: data.challenge.participants.length,
          participants: data.challenge.participants.map(p => ({
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

  const daysRemaining = Math.max(0, Math.ceil((new Date(challenge.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
  const daysElapsed = Math.max(0, Math.ceil((new Date().getTime() - new Date(challenge.startDate).getTime()) / (1000 * 60 * 60 * 24)));
  const totalDays = 90;
  const progressPercentage = Math.min(100, (daysElapsed / totalDays) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <Button
            as={Link}
            href="/admin/ninety-day-challenge"
            variant="ghost"
            startContent={<IconArrowLeft size={16} />}
          >
            Back to Challenges
          </Button>
        </div>

        {/* Title and Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {challenge.title}
            </h1>
            <p className="text-foreground-500 mt-2">
              Challenge Dashboard & Analytics
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <Button
              color="secondary"
              variant="shadow"
              size="lg"
              startContent={<IconUserPlus size={18} />}
              onPress={() => setIsAddParticipantModalOpen(true)}
              className="w-full sm:w-auto min-h-12 px-4"
            >
              Add Participant
            </Button>
            <Chip
              color={challenge.isActive ? "success" : "default"}
              variant="flat"
              size="lg"
            >
              {challenge.isActive ? "Active" : "Inactive"}
            </Chip>
          </div>
        </div>
      </div>

      {/* Challenge Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card shadow="none" className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-primary/70 font-bold tracking-wider mb-1">
                  Total Participants
                </p>
                <p className="text-3xl font-black text-primary">
                  {challenge._count.participants}
                </p>
              </div>
              <div className="p-3 bg-primary/15 rounded-xl">
                <IconUsers className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card shadow="none" className="bg-gradient-to-br from-secondary/5 to-secondary/10 border border-secondary/20">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-secondary/70 font-bold tracking-wider mb-1">
                  Days Elapsed
                </p>
                <p className="text-3xl font-black text-secondary">
                  {daysElapsed}
                </p>
                <p className="text-xs text-secondary/60">of 90 days</p>
              </div>
              <div className="p-3 bg-secondary/15 rounded-xl">
                <IconCalendarEvent className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card shadow="none" className="bg-gradient-to-br from-success/5 to-success/10 border border-success/20">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-success/70 font-bold tracking-wider mb-1">
                  Progress
                </p>
                <p className="text-3xl font-black text-success">
                  {Math.round(progressPercentage)}%
                </p>
                <p className="text-xs text-success/60">completion</p>
              </div>
              <div className="p-3 bg-success/15 rounded-xl">
                <IconChartBar className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card shadow="none" className="bg-gradient-to-br from-warning/5 to-warning/10 border border-warning/20">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-warning/70 font-bold tracking-wider mb-1">
                  Days Remaining
                </p>
                <p className="text-3xl font-black text-warning">
                  {daysRemaining}
                </p>
                <p className="text-xs text-warning/60">days left</p>
              </div>
              <div className="p-3 bg-warning/15 rounded-xl">
                <IconTrophy className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Participant Leaderboard */}
        <div className="xl:col-span-1">
          <Card shadow="none" className="bg-gradient-to-br from-background to-default-50 border border-divider shadow-xl h-full">
            <CardHeader className="flex items-center gap-4 pb-4">
              <div className="p-3 bg-gradient-to-br from-warning/20 to-warning/10 rounded-xl shadow-lg">
                <IconTrophy className="w-6 h-6 text-warning" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Leaderboard
                </h2>
                <p className="text-sm text-foreground-500">
                  Top performers this challenge
                </p>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <ParticipantLeaderboard participants={challenge.participants} />
            </CardBody>
          </Card>
        </div>

        {/* Challenge Analytics */}
        <div className="xl:col-span-2">
          <Card shadow="none" className="bg-gradient-to-br from-background to-default-50 border border-divider shadow-xl h-full">
            <CardHeader className="flex items-center gap-4 pb-4">
              <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl shadow-lg">
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
              <ChallengeAnalytics challenge={challenge} />
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Challenge Details */}
      <Card shadow="none" className="bg-gradient-to-br from-background to-default-50 border border-divider shadow-xl">
        <CardHeader className="flex items-center gap-4 pb-4">
          <div className="p-3 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-xl shadow-lg">
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
          <ChallengeDetails challenge={challenge} />
        </CardBody>
      </Card>

      {/* Challenge Community */}
      <ChallengeCommunity
        challengeId={challenge.id}
        challengeTitle={challenge.title}
      />

      {/* Add Participant Modal */}
      <AddParticipantModal
        isOpen={isAddParticipantModalOpen}
        onClose={() => setIsAddParticipantModalOpen(false)}
        challengeId={challenge.id}
        onParticipantAdded={handleParticipantAdded}
      />
    </div>
  );
}