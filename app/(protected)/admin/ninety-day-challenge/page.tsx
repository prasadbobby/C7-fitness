"use client";

import { useState, useEffect, useRef } from "react";
import { ChallengeManagement } from "./_components/ChallengeManagement";
import { Card, CardHeader, CardBody } from "@nextui-org/card";
import { Chip } from "@nextui-org/chip";
import { Button } from "@nextui-org/button";
import {
  IconCalendarEvent,
  IconUsers,
  IconTrendingUp,
  IconTarget,
  IconChartBar,
  IconFlame,
  IconChevronRight
} from "@tabler/icons-react";
import Link from "next/link";

interface Stats {
  activeChallenges: number;
  totalParticipants: number;
  completionRate: number;
  avgProgress: number;
}

export default function NinetyDayChallengePage() {
  const [stats, setStats] = useState<Stats>({
    activeChallenges: 0,
    totalParticipants: 0,
    completionRate: 0,
    avgProgress: 0
  });
  const [loading, setLoading] = useState(true);

  // Refs to trigger actions in child components
  const challengeManagementRef = useRef<{ triggerCreateChallenge: () => void }>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/ninety-day-challenge?stats=true');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallenge = () => {
    challengeManagementRef.current?.triggerCreateChallenge();
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-foreground-500">
        <Link href="/admin" className="hover:text-foreground-700">
          Admin
        </Link>
        <IconChevronRight size={16} />
        <span className="text-foreground-900 font-medium">90-Day Challenge</span>
      </nav>

      {/* Custom Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
            <IconFlame className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-foreground">
              90-Day Challenge Management
            </h1>
            <p className="text-zinc-500 text-sm md:text-base">
              Manage transformation challenges and monitor participant progress
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card shadow="none" className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-primary/70 font-bold tracking-wider mb-1">Active Challenges</p>
                <p className="text-4xl font-black text-primary mb-2">{stats.activeChallenges}</p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <p className="text-xs text-primary/60">Currently running</p>
                </div>
              </div>
              <div className="p-4 bg-primary/15 rounded-2xl">
                <IconCalendarEvent className="w-8 h-8 text-primary" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card shadow="none" className="bg-gradient-to-br from-secondary/5 to-secondary/10 border border-secondary/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-secondary/70 font-bold tracking-wider mb-1">Total Participants</p>
                <p className="text-4xl font-black text-secondary mb-2">{stats.totalParticipants}</p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
                  <p className="text-xs text-secondary/60">Active members</p>
                </div>
              </div>
              <div className="p-4 bg-secondary/15 rounded-2xl">
                <IconUsers className="w-8 h-8 text-secondary" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card shadow="none" className="bg-gradient-to-br from-success/5 to-success/10 border border-success/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-success/70 font-bold tracking-wider mb-1">Completion Rate</p>
                <p className="text-4xl font-black text-success mb-2">{stats.completionRate}%</p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <p className="text-xs text-success/60">Success rate</p>
                </div>
              </div>
              <div className="p-4 bg-success/15 rounded-2xl">
                <IconTrendingUp className="w-8 h-8 text-success" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card shadow="none" className="bg-gradient-to-br from-warning/5 to-warning/10 border border-warning/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-warning/70 font-bold tracking-wider mb-1">Avg Progress</p>
                <p className="text-4xl font-black text-warning mb-2">{stats.avgProgress}</p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-warning rounded-full animate-pulse"></div>
                  <p className="text-xs text-warning/60">days completed</p>
                </div>
              </div>
              <div className="p-4 bg-warning/15 rounded-2xl">
                <IconTarget className="w-8 h-8 text-warning" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Main Content - Modern Vertical Layout */}
      <div className="space-y-8">
        {/* Challenge Management Section */}
        <div className="w-full">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-2">
              <div className="flex items-center gap-4 flex-1">
                <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl shadow-lg">
                  <IconCalendarEvent className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Challenge Management
                  </h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    Create and manage 90-day transformation challenges
                  </p>
                </div>
              </div>
              <div className="flex justify-end sm:ml-auto">
                <Button
                  color="primary"
                  variant="shadow"
                  size="lg"
                  startContent={<IconCalendarEvent className="w-4 h-4" />}
                  className="px-6 py-2 font-semibold w-full sm:w-auto"
                  onPress={handleCreateChallenge}
                >
                  Create New Challenge
                </Button>
              </div>
            </div>
          </div>

          <Card shadow="none" className="bg-gradient-to-br from-background to-default-50 border border-divider shadow-xl">
            <CardBody className="p-8">
              <ChallengeManagement ref={challengeManagementRef} />
            </CardBody>
          </Card>
        </div>

      </div>
    </div>
  );
}