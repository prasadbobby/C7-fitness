"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Progress } from "@nextui-org/progress";
import { Chip } from "@nextui-org/chip";
import {
  IconMoon,
  IconMoodHappy,
  IconBolt,
  IconBrain,
  IconTrendingUp,
  IconTrendingDown,
  IconUsers,
  IconCalendarEvent
} from "@tabler/icons-react";

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
}

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  participants: Participant[];
  _count: {
    participants: number;
  };
}

interface ChallengeAnalyticsProps {
  challenge: Challenge;
}

interface AnalyticsData {
  overview: {
    totalPosts: number;
    avgPostsPerParticipant: number;
    participationRate: number;
    retentionRate: number;
  };
  wellness: {
    avgSleepHours: number;
    avgSleepQuality: number;
    avgMood: number;
    avgEnergy: number;
  };
  trends: {
    sleepTrend: 'up' | 'down' | 'stable';
    moodTrend: 'up' | 'down' | 'stable';
    energyTrend: 'up' | 'down' | 'stable';
    participationTrend: 'up' | 'down' | 'stable';
  };
  weeklyData: {
    week: number;
    posts: number;
    avgSleep: number;
    avgMood: number;
    avgEnergy: number;
  }[];
}

export function ChallengeAnalytics({ challenge }: ChallengeAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateAnalytics();
  }, [challenge]);

  const calculateAnalytics = () => {
    try {
      const allPosts = challenge.participants.flatMap(p => p.posts);
      const totalPosts = allPosts.length;
      const activeParticipants = challenge.participants.filter(p => p.posts.length > 0);

      // Overview metrics
      const avgPostsPerParticipant = challenge.participants.length > 0
        ? totalPosts / challenge.participants.length
        : 0;

      const daysElapsed = Math.max(1, Math.ceil((new Date().getTime() - new Date(challenge.startDate).getTime()) / (1000 * 60 * 60 * 24)));
      const expectedPosts = Math.min(daysElapsed, 90) * challenge.participants.length;
      const participationRate = expectedPosts > 0 ? (totalPosts / expectedPosts) * 100 : 0;

      const retentionRate = challenge.participants.length > 0
        ? (activeParticipants.length / challenge.participants.length) * 100
        : 0;

      // Wellness metrics
      const sleepHours = allPosts.filter(p => p.sleepHours !== null).map(p => p.sleepHours!);
      const avgSleepHours = sleepHours.length > 0
        ? sleepHours.reduce((sum, hours) => sum + hours, 0) / sleepHours.length
        : 0;

      const sleepQuality = allPosts
        .filter(p => p.sleepQuality !== null)
        .map(p => getSleepQualityScore(p.sleepQuality!));
      const avgSleepQuality = sleepQuality.length > 0
        ? sleepQuality.reduce((sum, score) => sum + score, 0) / sleepQuality.length
        : 0;

      const moods = allPosts
        .filter(p => p.mood !== null)
        .map(p => getMoodScore(p.mood!));
      const avgMood = moods.length > 0
        ? moods.reduce((sum, score) => sum + score, 0) / moods.length
        : 0;

      const energies = allPosts
        .filter(p => p.energy !== null)
        .map(p => getEnergyScore(p.energy!));
      const avgEnergy = energies.length > 0
        ? energies.reduce((sum, score) => sum + score, 0) / energies.length
        : 0;

      // Weekly data for trends
      const weeklyData = calculateWeeklyData(allPosts, challenge.startDate);
      const trends = calculateTrends(weeklyData);

      setAnalytics({
        overview: {
          totalPosts,
          avgPostsPerParticipant,
          participationRate,
          retentionRate
        },
        wellness: {
          avgSleepHours,
          avgSleepQuality,
          avgMood,
          avgEnergy
        },
        trends,
        weeklyData
      });
    } catch (error) {
      console.error('Error calculating analytics:', error);
    } finally {
      setLoading(false);
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

  const calculateWeeklyData = (posts: Post[], startDate: string) => {
    const weeks: { [key: number]: Post[] } = {};
    const challengeStart = new Date(startDate);

    posts.forEach(post => {
      const postDate = new Date(post.createdAt);
      const daysDiff = Math.floor((postDate.getTime() - challengeStart.getTime()) / (1000 * 60 * 60 * 24));
      const week = Math.floor(daysDiff / 7) + 1;

      if (week > 0 && week <= 13) { // 90 days = ~13 weeks
        if (!weeks[week]) weeks[week] = [];
        weeks[week].push(post);
      }
    });

    return Object.entries(weeks).map(([week, weekPosts]) => {
      const sleepHours = weekPosts.filter(p => p.sleepHours !== null).map(p => p.sleepHours!);
      const moods = weekPosts.filter(p => p.mood !== null).map(p => getMoodScore(p.mood!));
      const energies = weekPosts.filter(p => p.energy !== null).map(p => getEnergyScore(p.energy!));

      return {
        week: parseInt(week),
        posts: weekPosts.length,
        avgSleep: sleepHours.length > 0 ? sleepHours.reduce((sum, h) => sum + h, 0) / sleepHours.length : 0,
        avgMood: moods.length > 0 ? moods.reduce((sum, m) => sum + m, 0) / moods.length : 0,
        avgEnergy: energies.length > 0 ? energies.reduce((sum, e) => sum + e, 0) / energies.length : 0
      };
    }).sort((a, b) => a.week - b.week);
  };

  const calculateTrends = (weeklyData: any[]) => {
    if (weeklyData.length < 2) {
      return {
        sleepTrend: 'stable' as const,
        moodTrend: 'stable' as const,
        energyTrend: 'stable' as const,
        participationTrend: 'stable' as const
      };
    }

    const recent = weeklyData.slice(-3); // Last 3 weeks
    const earlier = weeklyData.slice(-6, -3); // 3 weeks before that

    const getTrend = (recentAvg: number, earlierAvg: number) => {
      const diff = recentAvg - earlierAvg;
      if (Math.abs(diff) < 0.1) return 'stable';
      return diff > 0 ? 'up' : 'down';
    };

    const recentAvgs = {
      sleep: recent.reduce((sum, w) => sum + w.avgSleep, 0) / recent.length,
      mood: recent.reduce((sum, w) => sum + w.avgMood, 0) / recent.length,
      energy: recent.reduce((sum, w) => sum + w.avgEnergy, 0) / recent.length,
      posts: recent.reduce((sum, w) => sum + w.posts, 0) / recent.length
    };

    const earlierAvgs = earlier.length > 0 ? {
      sleep: earlier.reduce((sum, w) => sum + w.avgSleep, 0) / earlier.length,
      mood: earlier.reduce((sum, w) => sum + w.avgMood, 0) / earlier.length,
      energy: earlier.reduce((sum, w) => sum + w.avgEnergy, 0) / earlier.length,
      posts: earlier.reduce((sum, w) => sum + w.posts, 0) / earlier.length
    } : recentAvgs;

    return {
      sleepTrend: getTrend(recentAvgs.sleep, earlierAvgs.sleep),
      moodTrend: getTrend(recentAvgs.mood, earlierAvgs.mood),
      energyTrend: getTrend(recentAvgs.energy, earlierAvgs.energy),
      participationTrend: getTrend(recentAvgs.posts, earlierAvgs.posts)
    };
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <IconTrendingUp className="w-4 h-4 text-success" />;
      case 'down':
        return <IconTrendingDown className="w-4 h-4 text-danger" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-warning"></div>;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'success';
      case 'down': return 'danger';
      default: return 'warning';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-foreground-500">Analyzing challenge data...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-foreground-500">Unable to generate analytics data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card shadow="sm">
          <CardBody className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <IconCalendarEvent className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-primary">{analytics.overview.totalPosts}</p>
            <p className="text-xs text-foreground-500">Total Posts</p>
          </CardBody>
        </Card>

        <Card shadow="sm">
          <CardBody className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <IconUsers className="w-5 h-5 text-secondary" />
            </div>
            <p className="text-2xl font-bold text-secondary">{analytics.overview.avgPostsPerParticipant.toFixed(1)}</p>
            <p className="text-xs text-foreground-500">Avg Posts/User</p>
          </CardBody>
        </Card>

        <Card shadow="sm">
          <CardBody className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <IconBrain className="w-5 h-5 text-success" />
            </div>
            <p className="text-2xl font-bold text-success">{Math.round(analytics.overview.participationRate)}%</p>
            <p className="text-xs text-foreground-500">Participation</p>
          </CardBody>
        </Card>

        <Card shadow="sm">
          <CardBody className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <IconTrendingUp className="w-5 h-5 text-warning" />
            </div>
            <p className="text-2xl font-bold text-warning">{Math.round(analytics.overview.retentionRate)}%</p>
            <p className="text-xs text-foreground-500">Retention</p>
          </CardBody>
        </Card>
      </div>

      {/* Wellness Metrics */}
      <Card shadow="sm">
        <CardHeader className="pb-3">
          <h3 className="text-lg font-semibold text-foreground">Wellness Metrics</h3>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconMoon className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium">Average Sleep</span>
                  {getTrendIcon(analytics.trends.sleepTrend)}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{analytics.wellness.avgSleepHours.toFixed(1)}h</p>
                  <p className="text-xs text-foreground-500">per night</p>
                </div>
              </div>
              <Progress
                value={(analytics.wellness.avgSleepHours / 10) * 100}
                color="primary"
                size="sm"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconMoodHappy className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium">Average Mood</span>
                  {getTrendIcon(analytics.trends.moodTrend)}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{analytics.wellness.avgMood.toFixed(1)}/5</p>
                  <p className="text-xs text-foreground-500">mood score</p>
                </div>
              </div>
              <Progress
                value={(analytics.wellness.avgMood / 5) * 100}
                color="success"
                size="sm"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconBolt className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-medium">Average Energy</span>
                  {getTrendIcon(analytics.trends.energyTrend)}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{analytics.wellness.avgEnergy.toFixed(1)}/5</p>
                  <p className="text-xs text-foreground-500">energy level</p>
                </div>
              </div>
              <Progress
                value={(analytics.wellness.avgEnergy / 5) * 100}
                color="warning"
                size="sm"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconBrain className="w-5 h-5 text-purple-500" />
                  <span className="text-sm font-medium">Sleep Quality</span>
                  <div className="w-4 h-4 rounded-full bg-default-400"></div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{analytics.wellness.avgSleepQuality.toFixed(1)}/5</p>
                  <p className="text-xs text-foreground-500">quality score</p>
                </div>
              </div>
              <Progress
                value={(analytics.wellness.avgSleepQuality / 5) * 100}
                color="secondary"
                size="sm"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Trends Summary */}
      <Card shadow="sm">
        <CardHeader className="pb-3">
          <h3 className="text-lg font-semibold text-foreground">Recent Trends</h3>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="flex flex-wrap gap-2">
            <Chip
              startContent={getTrendIcon(analytics.trends.sleepTrend)}
              color={getTrendColor(analytics.trends.sleepTrend)}
              variant="flat"
              size="sm"
            >
              Sleep {analytics.trends.sleepTrend}
            </Chip>
            <Chip
              startContent={getTrendIcon(analytics.trends.moodTrend)}
              color={getTrendColor(analytics.trends.moodTrend)}
              variant="flat"
              size="sm"
            >
              Mood {analytics.trends.moodTrend}
            </Chip>
            <Chip
              startContent={getTrendIcon(analytics.trends.energyTrend)}
              color={getTrendColor(analytics.trends.energyTrend)}
              variant="flat"
              size="sm"
            >
              Energy {analytics.trends.energyTrend}
            </Chip>
            <Chip
              startContent={getTrendIcon(analytics.trends.participationTrend)}
              color={getTrendColor(analytics.trends.participationTrend)}
              variant="flat"
              size="sm"
            >
              Participation {analytics.trends.participationTrend}
            </Chip>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}