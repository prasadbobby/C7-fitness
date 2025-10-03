"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Progress } from "@nextui-org/progress";
import { Calendar, Flame, TrendingUp } from "lucide-react";

interface Stats {
  totalDays: number;
  daysPassed: number;
  completedDays: number;
  streak: number;
  completionRate: number;
  lastPostDate: string | null;
}

interface Props {
  participant: {
    id: string;
    userId: string;
    challengeId: string;
    completedDays: number;
  };
}

export function ParticipantStats({ participant }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/admin/ninety-day-challenge/participants/${participant.id}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching participant stats:', error);
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
          <p className="text-zinc-500">Unable to load participant stats.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Progress Stats</h3>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Overall Progress</span>
            <span className="text-zinc-600 dark:text-zinc-400">
              {stats.daysPassed} / {stats.totalDays} days
            </span>
          </div>
          <Progress
            value={(stats.daysPassed / stats.totalDays) * 100}
            className="w-full"
            color="primary"
            size="sm"
          />
        </div>

        {/* Completion Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Completion Rate</span>
            <span className="text-zinc-600 dark:text-zinc-400">
              {stats.completionRate.toFixed(1)}%
            </span>
          </div>
          <Progress
            value={stats.completionRate}
            className="w-full"
            color={stats.completionRate >= 80 ? "success" : stats.completionRate >= 60 ? "warning" : "danger"}
            size="sm"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 text-center border border-green-200 dark:border-green-800">
            <div className="flex justify-center mb-2">
              <div className="p-2 bg-green-500 rounded-lg">
                <Calendar className="text-white" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {stats.completedDays}
            </div>
            <div className="text-sm font-medium text-green-600 dark:text-green-400">
              Days Posted
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4 text-center border border-orange-200 dark:border-orange-800">
            <div className="flex justify-center mb-2">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Flame className="text-white" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {stats.streak}
            </div>
            <div className="text-sm font-medium text-orange-600 dark:text-orange-400">
              Current Streak
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-800">
            <div className="flex justify-center mb-2">
              <div className="p-2 bg-blue-500 rounded-lg">
                <TrendingUp className="text-white" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {Math.max(0, stats.totalDays - stats.daysPassed)}
            </div>
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Days Remaining
            </div>
          </div>
        </div>

        {/* Last Post */}
        {stats.lastPostDate && (
          <div className="text-sm text-zinc-600 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-700">
            <strong>Last Post:</strong> {new Date(stats.lastPostDate).toLocaleDateString()}
          </div>
        )}
      </CardBody>
    </Card>
  );
}