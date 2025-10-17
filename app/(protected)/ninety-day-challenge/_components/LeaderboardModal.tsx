"use client";

import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@nextui-org/modal";
import { Button } from "@nextui-org/button";
import { Card, CardBody } from "@nextui-org/card";
import { Avatar } from "@nextui-org/avatar";
import { Chip } from "@nextui-org/chip";
import { Progress } from "@nextui-org/progress";
import { Tabs, Tab } from "@nextui-org/tabs";
import { IconTrophy, IconMedal, IconAward, IconMoon, IconBrain, IconBolt, IconMoodHappy, IconCalendarWeek, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
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

interface LeaderboardEntry extends Participant {
  score: number;
  metrics: {
    totalPosts: number;
    avgSleepHours: number;
    avgSleepQuality: number;
    avgMood: number;
    avgEnergy: number;
    consistency: number;
  };
  rank: number;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  challengeId: string;
  challengeTitle: string;
  currentUserId: string;
  challengeStartDate?: string;
  challengeEndDate?: string;
}

export function LeaderboardModal({
  isOpen,
  onClose,
  challengeId,
  challengeTitle,
  currentUserId,
  challengeStartDate,
  challengeEndDate
}: LeaderboardModalProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [currentUserWeeklyRank, setCurrentUserWeeklyRank] = useState<number | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<WeekInfo | null>(null);
  const [challengeWeeks, setChallengeWeeks] = useState<WeekInfo[]>([]);

  useEffect(() => {
    if (isOpen && challengeId) {
      fetchLeaderboard();
      if (challengeStartDate) {
        initializeWeeklyData();
      }
    }
  }, [isOpen, challengeId, challengeStartDate]);

  useEffect(() => {
    if (selectedWeek && challengeId) {
      fetchWeeklyLeaderboard();
    }
  }, [selectedWeek, challengeId]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ninety-day-challenge/leaderboard?challengeId=${challengeId}`);
      if (response.ok) {
        const data = await response.json();
        const processedLeaderboard = await processParticipants(data.participants);
        setLeaderboard(processedLeaderboard);

        // Find current user's rank
        const userRank = processedLeaderboard.find(entry => entry.userId === currentUserId)?.rank || null;
        setCurrentUserRank(userRank);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeWeeklyData = () => {
    if (!challengeStartDate) return;

    const weeks = getChallengeWeeks(challengeStartDate, challengeEndDate);
    setChallengeWeeks(weeks);

    // Set default selected week to current week or last completed week
    const currentWeek = getCurrentWeek(challengeStartDate);
    const lastCompletedWeek = getLastCompletedWeek(challengeStartDate);

    // Show last completed week if available, otherwise current week
    const defaultWeek = lastCompletedWeek || currentWeek || weeks[0];
    setSelectedWeek(defaultWeek);
  };

  const fetchWeeklyLeaderboard = async () => {
    if (!selectedWeek) return;

    setWeeklyLoading(true);
    try {
      const response = await fetch(`/api/ninety-day-challenge/leaderboard?challengeId=${challengeId}`);
      if (response.ok) {
        const data = await response.json();
        const weeklyProcessed = await processWeeklyParticipants(data.participants);
        setWeeklyLeaderboard(weeklyProcessed);

        // Find current user's weekly rank
        const userWeeklyRank = weeklyProcessed.find(entry => entry.userId === currentUserId)?.rank || null;
        setCurrentUserWeeklyRank(userWeeklyRank);
      }
    } catch (error) {
      console.error('Error fetching weekly leaderboard:', error);
    } finally {
      setWeeklyLoading(false);
    }
  };

  const processWeeklyParticipants = async (participants: Participant[]): Promise<LeaderboardEntry[]> => {
    if (!selectedWeek) return [];

    const enhanced = participants.map((participant) => {
      const weeklyMetrics = calculateWeeklyMetrics(
        participant.posts,
        selectedWeek,
        participant.joinedAt
      );
      const weeklyScore = calculateWeeklyScore(weeklyMetrics);

      return {
        ...participant,
        score: weeklyScore,
        rank: 0, // Will be set after sorting
        metrics: {
          totalPosts: weeklyMetrics.totalPosts,
          avgSleepHours: weeklyMetrics.avgSleepHours,
          avgSleepQuality: weeklyMetrics.avgSleepQuality,
          avgMood: weeklyMetrics.avgMood,
          avgEnergy: weeklyMetrics.avgEnergy,
          consistency: weeklyMetrics.consistency
        }
      };
    });

    // Sort by score and assign ranks
    enhanced.sort((a, b) => b.score - a.score);
    enhanced.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return enhanced;
  };

  const processParticipants = async (participants: Participant[]): Promise<LeaderboardEntry[]> => {
    const enhanced = participants.map((participant) => {
      // Calculate metrics
      const posts = participant.posts;
      const totalPosts = posts.length;

      // Sleep metrics with validation
      const sleepHours = posts
        .filter(p => p.sleepHours !== null && typeof p.sleepHours === 'number' && !isNaN(p.sleepHours) && p.sleepHours >= 0 && p.sleepHours <= 24)
        .map(p => p.sleepHours!);
      const avgSleepHours = sleepHours.length > 0
        ? sleepHours.reduce((sum, hours) => sum + hours, 0) / sleepHours.length
        : 0;

      // Sleep quality (convert to number) with validation
      const sleepQuality = posts
        .filter(p => p.sleepQuality !== null && typeof p.sleepQuality === 'string')
        .map(p => getSleepQualityScore(p.sleepQuality!))
        .filter(score => !isNaN(score) && score >= 0);
      const avgSleepQuality = sleepQuality.length > 0
        ? sleepQuality.reduce((sum, score) => sum + score, 0) / sleepQuality.length
        : 0;

      // Mood metrics with validation
      const moods = posts
        .filter(p => p.mood !== null && typeof p.mood === 'string')
        .map(p => getMoodScore(p.mood!))
        .filter(score => !isNaN(score) && score >= 0);
      const avgMood = moods.length > 0
        ? moods.reduce((sum, score) => sum + score, 0) / moods.length
        : 0;

      // Energy metrics with validation
      const energies = posts
        .filter(p => p.energy !== null && typeof p.energy === 'string')
        .map(p => getEnergyScore(p.energy!))
        .filter(score => !isNaN(score) && score >= 0);
      const avgEnergy = energies.length > 0
        ? energies.reduce((sum, score) => sum + score, 0) / energies.length
        : 0;

      // Consistency (posting frequency) - use UTC dates for consistency
      const now = new Date();
      const nowUTC = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      const joinedAtUTC = new Date(new Date(participant.joinedAt).getUTCFullYear(), new Date(participant.joinedAt).getUTCMonth(), new Date(participant.joinedAt).getUTCDate());

      const daysElapsed = Math.max(1, Math.ceil((nowUTC.getTime() - joinedAtUTC.getTime()) / (1000 * 60 * 60 * 24)));
      // Calculate expected posts based on days elapsed
      const consistency = Math.min(100, (totalPosts / daysElapsed) * 100);

      // Calculate overall score
      const score = calculateOverallScore({
        totalPosts,
        avgSleepHours,
        avgSleepQuality,
        avgMood,
        avgEnergy,
        consistency
      }, daysElapsed);

      return {
        ...participant,
        score,
        rank: 0, // Will be set after sorting
        metrics: {
          totalPosts,
          avgSleepHours,
          avgSleepQuality,
          avgMood,
          avgEnergy,
          consistency
        }
      };
    });

    // Sort by score and assign ranks
    enhanced.sort((a, b) => b.score - a.score);
    enhanced.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return enhanced;
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

  const getSleepQualityScore = (quality: string): number => {
    const scores: Record<string, number> = {
      'EXCELLENT': 5,
      'VERY_GOOD': 4,
      'GOOD': 3,
      'FAIR': 2,
      'POOR': 1
    };
    return scores[quality] || 0;
  };

  const getMoodScore = (mood: string): number => {
    const scores: Record<string, number> = {
      'EXCELLENT': 5,
      'VERY_GOOD': 4,
      'GOOD': 3,
      'NEUTRAL': 2,
      'LOW': 1,
      'VERY_LOW': 0
    };
    return scores[mood] || 0;
  };

  const getEnergyScore = (energy: string): number => {
    const scores: Record<string, number> = {
      'VERY_HIGH': 5,
      'HIGH': 4,
      'MODERATE': 3,
      'LOW': 2,
      'VERY_LOW': 1
    };
    return scores[energy] || 0;
  };

  const calculateOverallScore = (metrics: any, daysElapsed: number): number => {
    const weights = {
      consistency: 0.3,     // 30% - Most important
      avgSleepHours: 0.2,   // 20% - Sleep is crucial
      avgSleepQuality: 0.15, // 15%
      avgMood: 0.15,        // 15%
      avgEnergy: 0.15,      // 15%
      totalPosts: 0.05      // 5% - Bonus for engagement
    };

    const normalizedMetrics = {
      consistency: Math.min(100, metrics.consistency) / 100,
      avgSleepHours: Math.min(12, Math.max(0, metrics.avgSleepHours)) / 12,
      avgSleepQuality: metrics.avgSleepQuality / 5,
      avgMood: metrics.avgMood / 5,
      avgEnergy: metrics.avgEnergy / 5,
      totalPosts: Math.min(daysElapsed, metrics.totalPosts) / daysElapsed
    };

    return Object.entries(weights).reduce((score, [key, weight]) => {
      return score + (normalizedMetrics[key as keyof typeof normalizedMetrics] * weight * 100);
    }, 0);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      scrollBehavior="inside"
      classNames={{
        wrapper: "items-start justify-center pt-8",
        base: "max-h-[90vh]",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-warning/20 to-warning/10 rounded-xl">
              <IconTrophy className="w-6 h-6 text-warning" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Challenge Leaderboards</h2>
              <p className="text-sm text-foreground-500">{challengeTitle}</p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody className="px-6 pb-6">
          <Tabs aria-label="Leaderboard Options" size="sm" color="primary" className="mb-4">
            <Tab
              key="overall"
              title={
                <div className="flex items-center gap-2">
                  <IconTrophy size={16} />
                  <span>Overall</span>
                </div>
              }
            >
              {/* User Rank for Overall */}
              {currentUserRank && (
                <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-sm font-medium text-primary">
                    🎯 You are currently ranked #{currentUserRank} out of {leaderboard.length} participants
                  </p>
                </div>
              )}

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Card key={i} shadow="sm">
                      <CardBody className="p-4">
                        <div className="animate-pulse flex items-center gap-3">
                          <div className="w-10 h-10 bg-default-200 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-default-200 rounded w-1/3"></div>
                            <div className="h-3 bg-default-200 rounded w-1/2"></div>
                          </div>
                          <div className="w-16 h-8 bg-default-200 rounded"></div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <IconTrophy className="w-12 h-12 text-default-300 mx-auto mb-4" />
                  <p className="text-foreground-500">No participants to rank yet.</p>
                </div>
              ) : (
            <div className="space-y-3">
              {/* Top 3 Podium (if we have at least 3 participants) */}
              {leaderboard.length >= 3 && (
                <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gradient-to-r from-warning/5 to-secondary/5 rounded-lg border border-warning/20">
                  {/* 2nd Place */}
                  <div className="text-center pt-6">
                    <div className="relative">
                      <Avatar
                        src={leaderboard[1].user.imageUrl}
                        name={`${leaderboard[1].user.firstName} ${leaderboard[1].user.lastName}`}
                        size="lg"
                        className="mx-auto mb-2"
                      />
                      <div className="absolute -top-2 -right-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                        <IconMedal className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">
                      {leaderboard[1].user.firstName}
                    </p>
                    <p className="text-sm text-foreground-500">
                      {Math.round(leaderboard[1].score)} pts
                    </p>
                  </div>

                  {/* 1st Place */}
                  <div className="text-center">
                    <div className="relative">
                      <Avatar
                        src={leaderboard[0].user.imageUrl}
                        name={`${leaderboard[0].user.firstName} ${leaderboard[0].user.lastName}`}
                        size="lg"
                        className="mx-auto mb-2 ring-4 ring-yellow-200 w-20 h-20"
                      />
                      <div className="absolute -top-3 -right-3 p-2 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                        <IconTrophy className="w-5 h-5 text-yellow-500" />
                      </div>
                    </div>
                    <p className="text-base font-bold text-foreground truncate">
                      {leaderboard[0].user.firstName}
                    </p>
                    <p className="text-sm text-yellow-600 font-medium">
                      {Math.round(leaderboard[0].score)} pts
                    </p>
                  </div>

                  {/* 3rd Place */}
                  <div className="text-center pt-6">
                    <div className="relative">
                      <Avatar
                        src={leaderboard[2].user.imageUrl}
                        name={`${leaderboard[2].user.firstName} ${leaderboard[2].user.lastName}`}
                        size="lg"
                        className="mx-auto mb-2"
                      />
                      <div className="absolute -top-2 -right-2 p-1 bg-amber-100 dark:bg-amber-900 rounded-full">
                        <IconAward className="w-4 h-4 text-amber-600" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">
                      {leaderboard[2].user.firstName}
                    </p>
                    <p className="text-sm text-foreground-500">
                      {Math.round(leaderboard[2].score)} pts
                    </p>
                  </div>
                </div>
              )}

              {/* Full Rankings List */}
              <div className="space-y-2">
                {leaderboard.map((participant) => (
                  <Card
                    key={participant.id}
                    shadow="sm"
                    className={`transition-all duration-200 ${
                      participant.userId === currentUserId
                        ? 'ring-2 ring-primary bg-primary/5 hover:shadow-lg scale-[1.02]'
                        : 'hover:shadow-md'
                    }`}
                  >
                    <CardBody className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {getRankIcon(participant.rank)}
                          <Avatar
                            src={participant.user.imageUrl}
                            name={`${participant.user.firstName} ${participant.user.lastName}`}
                            size="sm"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className={`font-medium text-sm truncate ${
                                participant.userId === currentUserId ? 'text-primary font-bold' : 'text-foreground'
                              }`}>
                                {participant.user.firstName} {participant.user.lastName}
                                {participant.userId === currentUserId && (
                                  <span className="text-xs bg-primary text-white px-2 py-1 rounded-full ml-2">
                                    You
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Chip size="sm" variant="flat" color={getRankColor(participant.rank)}>
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
                          color={participant.userId === currentUserId ? "primary" : getRankColor(participant.rank)}
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
                          <span>{participant.metrics.avgMood.toFixed(1)}/5</span>
                        </div>
                        <div className="flex items-center gap-1 text-foreground-500">
                          <IconBolt size={12} />
                          <span>{participant.metrics.avgEnergy.toFixed(1)}/5</span>
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

              {/* Scoring Explanation */}
              <Card className="mt-6">
                <CardBody className="p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-2">How Scoring Works</h3>
                  <div className="text-xs text-foreground-500 space-y-1">
                    <p>• <strong>Consistency (30%)</strong>: Daily posting frequency</p>
                    <p>• <strong>Sleep Hours (20%)</strong>: Average sleep duration</p>
                    <p>• <strong>Sleep Quality (15%)</strong>: Quality of sleep reported</p>
                    <p>• <strong>Mood (15%)</strong>: Average mood ratings</p>
                    <p>• <strong>Energy (15%)</strong>: Average energy levels</p>
                    <p>• <strong>Engagement (5%)</strong>: Total posts bonus</p>
                  </div>
                </CardBody>
              </Card>
            </div>
              )}
            </Tab>

            <Tab
              key="weekly"
              title={
                <div className="flex items-center gap-2">
                  <IconCalendarWeek size={16} />
                  <span>Weekly</span>
                </div>
              }
            >
              {/* Week Navigation */}
              <div className="mb-4 flex items-center justify-between gap-4">
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
                      {selectedWeek && (
                        <Chip
                          color={selectedWeek.isCurrentWeek ? "primary" : selectedWeek.isCompleted ? "success" : "default"}
                          variant="flat"
                          size="sm"
                        >
                          {selectedWeek.isCurrentWeek ? "Current Week" : selectedWeek.isCompleted ? "Completed" : "Upcoming"}
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

                {/* Quick Week Selector */}
                <div className="flex items-center gap-1">
                  {challengeWeeks.slice(0, 5).map((week, index) => (
                    <Button
                      key={week.weekNumber}
                      size="sm"
                      variant={selectedWeek?.weekNumber === week.weekNumber ? "solid" : "light"}
                      color={week.isCurrentWeek ? "primary" : week.isCompleted ? "success" : "default"}
                      onPress={() => setSelectedWeek(week)}
                      className="min-w-unit-8 px-2"
                    >
                      {week.weekNumber}
                    </Button>
                  ))}
                  {challengeWeeks.length > 5 && (
                    <span className="text-xs text-foreground-500 ml-1">...</span>
                  )}
                </div>
              </div>

              {/* Week Status Info */}
              {selectedWeek?.isCompleted && (
                <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg">
                  <p className="text-sm font-medium text-success">
                    🏆 Week {selectedWeek.weekNumber} completed! Final results are locked.
                  </p>
                  <p className="text-xs text-success-600 mt-1">
                    View other weeks using the navigation above.
                  </p>
                </div>
              )}

              {/* User Weekly Rank */}
              {currentUserWeeklyRank && (
                <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-sm font-medium text-primary">
                    🎯 You are ranked #{currentUserWeeklyRank} this week out of {weeklyLeaderboard.length} participants
                  </p>
                </div>
              )}

              {weeklyLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Card key={i} shadow="sm">
                      <CardBody className="p-4">
                        <div className="animate-pulse flex items-center gap-3">
                          <div className="w-10 h-10 bg-default-200 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-default-200 rounded w-1/3"></div>
                            <div className="h-3 bg-default-200 rounded w-1/2"></div>
                          </div>
                          <div className="w-16 h-8 bg-default-200 rounded"></div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              ) : !selectedWeek ? (
                <div className="text-center py-8">
                  <IconCalendarWeek className="w-12 h-12 text-default-300 mx-auto mb-4" />
                  <p className="text-foreground-500">Week data not available.</p>
                </div>
              ) : weeklyLeaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <IconCalendarWeek className="w-12 h-12 text-default-300 mx-auto mb-4" />
                  <p className="text-foreground-500">No participants for this week.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Weekly Top 3 Podium (for completed weeks) */}
                  {selectedWeek.isCompleted && weeklyLeaderboard.length >= 3 && (
                    <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="text-center">
                        <div className="relative">
                          <Avatar
                            src={weeklyLeaderboard[1].user.imageUrl}
                            name={`${weeklyLeaderboard[1].user.firstName} ${weeklyLeaderboard[1].user.lastName}`}
                            size="md"
                            className="mx-auto mb-2"
                          />
                          <div className="absolute -top-2 -right-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                            <IconMedal className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                        <p className="text-xs font-medium text-foreground truncate">
                          {weeklyLeaderboard[1].user.firstName}
                        </p>
                        <p className="text-xs text-foreground-500">
                          {weeklyLeaderboard[1].score} pts
                        </p>
                      </div>

                      <div className="text-center -mt-4">
                        <div className="relative">
                          <Avatar
                            src={weeklyLeaderboard[0].user.imageUrl}
                            name={`${weeklyLeaderboard[0].user.firstName} ${weeklyLeaderboard[0].user.lastName}`}
                            size="lg"
                            className="mx-auto mb-2 ring-4 ring-yellow-200"
                          />
                          <div className="absolute -top-3 -right-3 p-2 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                            <IconTrophy className="w-5 h-5 text-yellow-500" />
                          </div>
                        </div>
                        <p className="text-sm font-bold text-foreground truncate">
                          🏆 {weeklyLeaderboard[0].user.firstName}
                        </p>
                        <p className="text-sm text-yellow-600 font-medium">
                          {weeklyLeaderboard[0].score} pts
                        </p>
                        <Chip size="sm" color="warning" variant="flat" className="mt-1">
                          Week Champion
                        </Chip>
                      </div>

                      <div className="text-center">
                        <div className="relative">
                          <Avatar
                            src={weeklyLeaderboard[2].user.imageUrl}
                            name={`${weeklyLeaderboard[2].user.firstName} ${weeklyLeaderboard[2].user.lastName}`}
                            size="md"
                            className="mx-auto mb-2"
                          />
                          <div className="absolute -top-2 -right-2 p-1 bg-amber-100 dark:bg-amber-900 rounded-full">
                            <IconAward className="w-4 h-4 text-amber-600" />
                          </div>
                        </div>
                        <p className="text-xs font-medium text-foreground truncate">
                          {weeklyLeaderboard[2].user.firstName}
                        </p>
                        <p className="text-xs text-foreground-500">
                          {weeklyLeaderboard[2].score} pts
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Weekly Rankings List */}
                  <div className="space-y-2">
                    {weeklyLeaderboard.map((participant) => (
                      <Card
                        key={participant.id}
                        shadow="sm"
                        className={`transition-all duration-200 ${
                          participant.userId === currentUserId
                            ? 'ring-2 ring-primary bg-primary/5 hover:shadow-lg scale-[1.02]'
                            : 'hover:shadow-md'
                        }`}
                      >
                        <CardBody className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              {getRankIcon(participant.rank)}
                              <Avatar
                                src={participant.user.imageUrl}
                                name={`${participant.user.firstName} ${participant.user.lastName}`}
                                size="sm"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className={`font-medium text-sm truncate ${
                                    participant.userId === currentUserId ? 'text-primary font-bold' : 'text-foreground'
                                  }`}>
                                    {participant.user.firstName} {participant.user.lastName}
                                    {participant.userId === currentUserId && (
                                      <span className="text-xs bg-primary text-white px-2 py-1 rounded-full ml-2">
                                        You
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Chip size="sm" variant="flat" color={getRankColor(participant.rank)}>
                                    {participant.score} pts
                                  </Chip>
                                  <span className="text-xs text-foreground-500">
                                    {participant.metrics.totalPosts} posts this week
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
                              color={participant.userId === currentUserId ? "primary" : getRankColor(participant.rank)}
                              className="w-full"
                            />
                          </div>

                          {/* Weekly Metrics */}
                          <div className="flex items-center justify-between mt-3 text-xs">
                            <div className="flex items-center gap-1 text-foreground-500">
                              <IconMoon size={12} />
                              <span>{participant.metrics.avgSleepHours.toFixed(1)}h</span>
                            </div>
                            <div className="flex items-center gap-1 text-foreground-500">
                              <IconMoodHappy size={12} />
                              <span>{participant.metrics.avgMood.toFixed(1)}/5</span>
                            </div>
                            <div className="flex items-center gap-1 text-foreground-500">
                              <IconBolt size={12} />
                              <span>{participant.metrics.avgEnergy.toFixed(1)}/5</span>
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

                  {/* Weekly Scoring Explanation */}
                  <Card className="mt-6">
                    <CardBody className="p-4">
                      <h3 className="text-sm font-semibold text-foreground mb-2">Weekly Scoring (IST Timezone)</h3>
                      <div className="text-xs text-foreground-500 space-y-1">
                        <p>• <strong>Week Period</strong>: Monday 12:00 AM - Sunday 11:59 PM (Indian Time)</p>
                        <p>• <strong>Consistency (40%)</strong>: Daily posting within the week</p>
                        <p>• <strong>Sleep, Mood, Energy (60%)</strong>: Average quality metrics for the week</p>
                        <p>• <strong>Reset</strong>: Leaderboard resets every Monday morning</p>
                        <p>• <strong>Navigation</strong>: Use ← → arrows or week numbers to view any week's results</p>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              )}
            </Tab>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}