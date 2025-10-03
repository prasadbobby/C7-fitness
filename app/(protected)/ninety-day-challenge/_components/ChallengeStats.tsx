"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@nextui-org/card";
import { Progress } from "@nextui-org/progress";
import { Chip } from "@nextui-org/chip";
import { Calendar, Flame, TrendingUp, Users } from "lucide-react";

interface ChallengeInfo {
  challengeTitle: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  daysPassed: number;
  daysRemaining: number;
  completedDays: number;
  streak: number;
  totalParticipants: number;
}

export function ChallengeStats() {
  const [stats, setStats] = useState<ChallengeInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallengeStats();
  }, []);

  const fetchChallengeStats = async () => {
    try {
      const response = await fetch('/api/ninety-day-challenge/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching challenge stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardBody>
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4"></div>
            <div className="h-20 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardBody className="text-center py-8">
          <p className="text-zinc-500">Unable to load challenge stats.</p>
        </CardBody>
      </Card>
    );
  }

  const progressPercentage = (stats.daysPassed / stats.totalDays) * 100;
  const completionPercentage = (stats.completedDays / stats.daysPassed) * 100;

  return (
    <Card>
      <CardBody className="space-y-6">
        {/* Challenge Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">
              {stats.challengeTitle}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              {new Date(stats.startDate).toLocaleDateString()} - {new Date(stats.endDate).toLocaleDateString()}
            </p>
          </div>
          <Chip color="primary" size="lg">
            Day {stats.daysPassed} of {stats.totalDays}
          </Chip>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Challenge Progress</span>
            <span className="text-zinc-600 dark:text-zinc-400">
              {stats.daysRemaining} days remaining
            </span>
          </div>
          <Progress
            value={progressPercentage}
            className="w-full"
            color="primary"
            size="lg"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <Calendar className="text-green-500" size={24} />
            </div>
            <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">
              {stats.completedDays}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Days Completed
            </div>
            <div className="text-xs text-green-600">
              {completionPercentage.toFixed(1)}% completion rate
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <Flame className="text-orange-500" size={24} />
            </div>
            <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">
              {stats.streak}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Current Streak
            </div>
            <div className="text-xs text-orange-600">
              Keep it going!
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <TrendingUp className="text-blue-500" size={24} />
            </div>
            <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">
              {stats.daysPassed}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Days Passed
            </div>
            <div className="text-xs text-blue-600">
              {progressPercentage.toFixed(1)}% through
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <Users className="text-purple-500" size={24} />
            </div>
            <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">
              {stats.totalParticipants}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Total Participants
            </div>
            <div className="text-xs text-purple-600">
              Community strong!
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}