"use client";

import { useState, useEffect } from "react";
import { Avatar } from "@nextui-org/avatar";
import { Card, CardBody } from "@nextui-org/card";
import { Progress } from "@nextui-org/progress";
import { Chip } from "@nextui-org/chip";
import {
  IconTrophy,
  IconMedal,
  IconAward,
  IconMoon,
  IconBrain,
  IconBolt,
  IconMoodHappy
} from "@tabler/icons-react";
import {
  calculateParticipantMetrics,
  calculateChallengeScore
} from "@/utils/challengeScoring";

interface Post {
  date: string;
  sleepHours: number | null;
  sleepQuality: string | null;
  mood: string | null;
  energy: string | null;
  createdAt: string;
}

interface Participant {
  id: string;
  userId: string;
  isEnabled: boolean;
  joinedAt: string;
  posts: Post[];
  user: {
    firstName: string;
    lastName: string;
    imageUrl: string;
    email: string;
    username: string;
  };
}

interface ParticipantLeaderboardProps {
  participants: Participant[];
}

interface EnhancedParticipant extends Participant {
  user: {
    firstName: string;
    lastName: string;
    imageUrl: string;
    email: string;
    username: string;
  };
  score: number;
  metrics: {
    totalPosts: number;
    avgSleepHours: number;
    avgSleepQuality: number;
    avgMood: number;
    avgEnergy: number;
    consistency: number;
  };
}

export function ParticipantLeaderboard({ participants }: ParticipantLeaderboardProps) {
  const [enhancedParticipants, setEnhancedParticipants] = useState<EnhancedParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    enhanceParticipants();
  }, [participants]);

  const enhanceParticipants = async () => {
    try {
      const enhanced = await Promise.all(
        participants.map(async (participant) => {
          // User info is already included in participant data
          const userInfo = participant.user;

          // Calculate metrics using unified scoring system
          const metrics = calculateParticipantMetrics(participant.posts, participant.joinedAt);

          // Calculate score using unified scoring system
          const now = new Date();
          const nowUTC = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
          const joinedAtUTC = new Date(new Date(participant.joinedAt).getUTCFullYear(), new Date(participant.joinedAt).getUTCMonth(), new Date(participant.joinedAt).getUTCDate());
          const daysElapsed = Math.max(1, Math.ceil((nowUTC.getTime() - joinedAtUTC.getTime()) / (1000 * 60 * 60 * 24)));

          const score = calculateChallengeScore(metrics, daysElapsed);

          return {
            ...participant,
            user: userInfo,
            score,
            metrics: {
              totalPosts: metrics.totalPosts,
              avgSleepHours: metrics.avgSleepHours,
              avgSleepQuality: metrics.avgSleepQuality,
              avgMood: metrics.avgMood,
              avgEnergy: metrics.avgEnergy,
              consistency: metrics.consistency
            }
          };
        })
      );

      // Sort by score
      enhanced.sort((a, b) => b.score - a.score);
      setEnhancedParticipants(enhanced);
    } catch (error) {
      console.error('Error enhancing participants:', error);
    } finally {
      setLoading(false);
    }
  };


  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <IconTrophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <IconMedal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <IconAward className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-foreground-500">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return "warning";
      case 2: return "default";
      case 3: return "secondary";
      default: return "primary";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-foreground-500">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (enhancedParticipants.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-foreground-500">No participants to rank yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top 3 Podium */}
      {enhancedParticipants.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 mb-6">
          {/* 2nd Place */}
          <div className="text-center pt-8">
            <div className="relative">
              <Avatar
                src={enhancedParticipants[1].user.imageUrl}
                name={`${enhancedParticipants[1].user.firstName} ${enhancedParticipants[1].user.lastName}`}
                size="lg"
                className="mx-auto mb-2"
              />
              <div className="absolute -top-2 -right-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                <IconMedal className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            <p className="text-xs font-medium text-foreground truncate">
              {enhancedParticipants[1].user.firstName}
            </p>
            <p className="text-xs text-foreground-500">
              {Math.round(enhancedParticipants[1].score)}
            </p>
          </div>

          {/* 1st Place */}
          <div className="text-center">
            <div className="relative">
              <Avatar
                src={enhancedParticipants[0].user.imageUrl}
                name={`${enhancedParticipants[0].user.firstName} ${enhancedParticipants[0].user.lastName}`}
                size="lg"
                className="mx-auto mb-2 ring-4 ring-yellow-200"
              />
              <div className="absolute -top-3 -right-3 p-2 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                <IconTrophy className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
            <p className="text-sm font-bold text-foreground truncate">
              {enhancedParticipants[0].user.firstName}
            </p>
            <p className="text-sm text-yellow-600 font-medium">
              {Math.round(enhancedParticipants[0].score)}
            </p>
          </div>

          {/* 3rd Place */}
          <div className="text-center pt-8">
            <div className="relative">
              <Avatar
                src={enhancedParticipants[2].user.imageUrl}
                name={`${enhancedParticipants[2].user.firstName} ${enhancedParticipants[2].user.lastName}`}
                size="lg"
                className="mx-auto mb-2"
              />
              <div className="absolute -top-2 -right-2 p-1 bg-amber-100 dark:bg-amber-900 rounded-full">
                <IconAward className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <p className="text-xs font-medium text-foreground truncate">
              {enhancedParticipants[2].user.firstName}
            </p>
            <p className="text-xs text-foreground-500">
              {Math.round(enhancedParticipants[2].score)}
            </p>
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="space-y-2">
        {enhancedParticipants.map((participant, index) => (
          <Card key={participant.id} shadow="sm" className="hover:shadow-md transition-shadow">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {getRankIcon(index + 1)}
                  <Avatar
                    src={participant.user.imageUrl}
                    name={`${participant.user.firstName} ${participant.user.lastName}`}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-foreground truncate">
                      {participant.user.firstName} {participant.user.lastName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Chip size="sm" variant="flat" color={getRankColor(index + 1)}>
                        {Math.round(participant.score)} pts
                      </Chip>
                      <span className="text-xs text-foreground-500">
                        {participant.metrics.totalPosts} posts
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <Progress
                  value={participant.score}
                  maxValue={100}
                  size="sm"
                  color={getRankColor(index + 1)}
                  className="w-full"
                />
              </div>

              {/* Quick Metrics */}
              <div className="flex items-center justify-between mt-3 text-xs">
                <div className="flex items-center gap-1 text-foreground-500">
                  <IconMoon size={12} />
                  <span>{participant.metrics.avgSleepHours.toFixed(1)}h</span>
                </div>
                <div className="flex items-center gap-1 text-foreground-500">
                  <IconMoodHappy size={12} />
                  <span>{(participant.metrics.avgMood).toFixed(1)}/5</span>
                </div>
                <div className="flex items-center gap-1 text-foreground-500">
                  <IconBolt size={12} />
                  <span>{(participant.metrics.avgEnergy).toFixed(1)}/5</span>
                </div>
                <div className="flex items-center gap-1 text-foreground-500">
                  <IconBrain size={12} />
                  <span>{Math.round(participant.metrics.consistency)}%</span>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}