"use client";

import { useState, useEffect } from "react";
import { Avatar } from "@nextui-org/avatar";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Progress } from "@nextui-org/progress";
import { Chip } from "@nextui-org/chip";
import { Button } from "@nextui-org/button";
import { Select, SelectItem } from "@nextui-org/select";
import {
  IconTrophy,
  IconMedal,
  IconAward,
  IconMoon,
  IconBrain,
  IconBolt,
  IconMoodHappy,
  IconPhoto,
  IconChevronLeft,
  IconChevronRight,
  IconCalendarWeek,
  IconGift
} from "@tabler/icons-react";
import {
  getChallengeWeeks,
  getCurrentWeek,
  getLastCompletedWeek,
  calculateWeeklyMetrics,
  calculateWeeklyScore,
  formatWeekDisplay,
  type WeekInfo
} from "@/utils/weeklyScoring";

interface Post {
  date: string;
  sleepHours: number | null;
  sleepQuality: string | null;
  mood: string | null;
  energy: string | null;
  photos: string[] | null;
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

interface WeeklyLeaderboardProps {
  participants: Participant[];
  challengeStartDate: string;
  challengeEndDate?: string;
}

interface WeeklyParticipant extends Participant {
  weeklyScore: number;
  weeklyMetrics: {
    totalPosts: number;
    totalEligibleDays: number;
    consistency: number;
    avgSleepHours: number;
    avgSleepQuality: number;
    avgMood: number;
    avgEnergy: number;
  };
}

export function WeeklyLeaderboard({
  participants,
  challengeStartDate,
  challengeEndDate
}: WeeklyLeaderboardProps) {
  const [enhancedParticipants, setEnhancedParticipants] = useState<WeeklyParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<WeekInfo | null>(null);
  const [challengeWeeks, setChallengeWeeks] = useState<WeekInfo[]>([]);

  useEffect(() => {
    initializeWeeks();
  }, [challengeStartDate, challengeEndDate]);

  useEffect(() => {
    if (selectedWeek) {
      calculateWeeklyLeaderboard();
    }
  }, [selectedWeek, participants]);

  const initializeWeeks = () => {
    const weeks = getChallengeWeeks(challengeStartDate, challengeEndDate);
    setChallengeWeeks(weeks);

    // Set default selected week to current week or last completed week
    const currentWeek = getCurrentWeek(challengeStartDate);
    const lastCompletedWeek = getLastCompletedWeek(challengeStartDate);

    // Show last completed week if available, otherwise current week
    const defaultWeek = lastCompletedWeek || currentWeek || weeks[0];
    setSelectedWeek(defaultWeek);
  };

  const calculateWeeklyLeaderboard = async () => {
    if (!selectedWeek) return;

    setLoading(true);
    try {
      const enhanced = participants.map((participant) => {
        const weeklyMetrics = calculateWeeklyMetrics(
          participant.posts,
          selectedWeek,
          participant.joinedAt
        );
        const weeklyScore = calculateWeeklyScore(weeklyMetrics);

        return {
          ...participant,
          weeklyScore,
          weeklyMetrics
        };
      });

      // Sort by weekly score
      enhanced.sort((a, b) => b.weeklyScore - a.weeklyScore);
      setEnhancedParticipants(enhanced);
    } catch (error) {
      console.error('Error calculating weekly leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (!selectedWeek) return;

    const currentIndex = challengeWeeks.findIndex(week =>
      week.weekNumber === selectedWeek.weekNumber
    );

    if (direction === 'prev' && currentIndex > 0) {
      setSelectedWeek(challengeWeeks[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < challengeWeeks.length - 1) {
      setSelectedWeek(challengeWeeks[currentIndex + 1]);
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

  const getWeekStatusChip = () => {
    if (!selectedWeek) return null;

    if (selectedWeek.isCurrentWeek) {
      return <Chip color="primary" variant="flat" size="sm">Current Week</Chip>;
    } else if (selectedWeek.isCompleted) {
      return <Chip color="success" variant="flat" size="sm">Completed</Chip>;
    } else {
      return <Chip color="default" variant="flat" size="sm">Upcoming</Chip>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-foreground-500">Loading weekly leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            onPress={() => navigateWeek('prev')}
            isDisabled={!selectedWeek || challengeWeeks.findIndex(w => w.weekNumber === selectedWeek.weekNumber) === 0}
          >
            <IconChevronLeft size={16} />
          </Button>

          <div className="flex flex-col items-center min-w-0">
            <h3 className="font-semibold text-sm text-foreground">
              {selectedWeek ? formatWeekDisplay(selectedWeek) : 'Loading...'}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {getWeekStatusChip()}
              {selectedWeek?.isCompleted && (
                <Chip color="secondary" variant="flat" size="sm" startContent={<IconGift size={12} />}>
                  Rewards Available
                </Chip>
              )}
            </div>
          </div>

          <Button
            isIconOnly
            size="sm"
            variant="flat"
            onPress={() => navigateWeek('next')}
            isDisabled={!selectedWeek || challengeWeeks.findIndex(w => w.weekNumber === selectedWeek.weekNumber) === challengeWeeks.length - 1}
          >
            <IconChevronRight size={16} />
          </Button>
        </div>

        {/* Week Selector */}
        <Select
          size="sm"
          placeholder="Select Week"
          className="w-32"
          selectedKeys={selectedWeek ? [selectedWeek.weekNumber.toString()] : []}
          onSelectionChange={(keys) => {
            const weekNumber = parseInt(Array.from(keys)[0] as string);
            const week = challengeWeeks.find(w => w.weekNumber === weekNumber);
            if (week) setSelectedWeek(week);
          }}
        >
          {challengeWeeks.map((week) => (
            <SelectItem key={week.weekNumber.toString()} value={week.weekNumber.toString()}>
              Week {week.weekNumber}
            </SelectItem>
          ))}
        </Select>
      </div>

      {/* Top 3 Podium for completed weeks */}
      {selectedWeek?.isCompleted && enhancedParticipants.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 mb-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="text-center">
            <div className="relative">
              <Avatar
                src={enhancedParticipants[1].user.imageUrl}
                name={`${enhancedParticipants[1].user.firstName} ${enhancedParticipants[1].user.lastName}`}
                size="md"
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
              {enhancedParticipants[1].weeklyScore} pts
            </p>
          </div>

          <div className="text-center -mt-4">
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
              🏆 {enhancedParticipants[0].user.firstName}
            </p>
            <p className="text-sm text-yellow-600 font-medium">
              {enhancedParticipants[0].weeklyScore} pts
            </p>
            <Chip size="sm" color="warning" variant="flat" className="mt-1">
              Week Champion
            </Chip>
          </div>

          <div className="text-center">
            <div className="relative">
              <Avatar
                src={enhancedParticipants[2].user.imageUrl}
                name={`${enhancedParticipants[2].user.firstName} ${enhancedParticipants[2].user.lastName}`}
                size="md"
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
              {enhancedParticipants[2].weeklyScore} pts
            </p>
          </div>
        </div>
      )}

      {/* Weekly Leaderboard List */}
      <div className="space-y-2">
        {enhancedParticipants.length === 0 ? (
          <div className="text-center py-8">
            <IconCalendarWeek className="w-12 h-12 text-foreground-300 mx-auto mb-3" />
            <p className="text-foreground-500">No participants for this week.</p>
          </div>
        ) : (
          enhancedParticipants.map((participant, index) => (
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
                          {participant.weeklyScore} pts
                        </Chip>
                        <span className="text-xs text-foreground-500">
                          {participant.weeklyMetrics.weekProgress}/{participant.weeklyMetrics.totalWeekDays} days
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <Progress
                    value={participant.weeklyScore}
                    maxValue={100}
                    size="sm"
                    color={getRankColor(index + 1)}
                    className="w-full"
                  />
                </div>

                {/* Weekly Metrics */}
                <div className="flex items-center justify-between mt-3 text-xs">
                  <div className="flex items-center gap-1 text-foreground-500">
                    <IconMoon size={12} />
                    <span>{participant.weeklyMetrics.avgSleepHours.toFixed(1)}h</span>
                  </div>
                  <div className="flex items-center gap-1 text-foreground-500">
                    <IconMoodHappy size={12} />
                    <span>{participant.weeklyMetrics.avgMood.toFixed(1)}/5</span>
                  </div>
                  <div className="flex items-center gap-1 text-foreground-500">
                    <IconBolt size={12} />
                    <span>{participant.weeklyMetrics.avgEnergy.toFixed(1)}/5</span>
                  </div>
                  <div className="flex items-center gap-1 text-foreground-500">
                    <IconPhoto size={12} />
                    <span>{participant.weeklyMetrics.photoScore.toFixed(1)}/3</span>
                  </div>
                  <div className="flex items-center gap-1 text-foreground-500">
                    <IconBrain size={12} />
                    <span>{Math.round(participant.weeklyMetrics.consistency)}%</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>

      {/* Admin Note for Completed Weeks */}
      {selectedWeek?.isCompleted && enhancedParticipants.length > 0 && (
        <Card className="bg-gradient-to-r from-secondary-50 to-primary-50 dark:from-secondary-900/20 dark:to-primary-900/20 border border-secondary-200 dark:border-secondary-800">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <IconGift className="w-5 h-5 text-secondary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Week {selectedWeek.weekNumber} completed!
                </p>
                <p className="text-xs text-foreground-500">
                  Consider giving weekly perks/rewards to top performers. Leaderboard resets every Monday.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}