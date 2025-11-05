"use client";

import { useState, useEffect } from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@nextui-org/table";
import { Avatar } from "@nextui-org/avatar";
import { Chip } from "@nextui-org/chip";
import { Button } from "@nextui-org/button";
import { Progress } from "@nextui-org/progress";
import { Input } from "@nextui-org/input";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/dropdown";
import {
  IconSearch,
  IconFilter,
  IconEye,
  IconTrendingUp,
  IconMoon,
  IconMoodHappy,
  IconBolt
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
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
  photos?: string[] | null; // Optional for backward compatibility
  photoCount?: number; // New optimized field for scoring
  isFasting?: boolean | null; // Required for photo scoring calculation
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

interface ChallengeDetailsProps {
  challenge: Challenge;
}

interface EnhancedParticipant extends Participant {
  user: {
    firstName: string;
    lastName: string;
    imageUrl: string;
    email: string;
    username: string;
  };
  metrics: {
    totalPosts: number;
    avgSleepHours: number;
    avgMood: number;
    avgEnergy: number;
    consistency: number;
    lastActive: string | null;
  };
  score: number;
}

export function ChallengeDetails({ challenge }: ChallengeDetailsProps) {
  const router = useRouter();
  const [participants, setParticipants] = useState<EnhancedParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [sortBy, setSortBy] = useState<string>("score");

  useEffect(() => {
    enhanceParticipants();
  }, [challenge]);

  const enhanceParticipants = async () => {
    try {
      const enhanced = await Promise.all(
        challenge.participants.map(async (participant) => {
          // User info is already included in participant data
          const userInfo = participant.user;

          // Calculate metrics using unified scoring system
          const metrics = calculateParticipantMetrics(
            participant.posts.map(post => ({
              ...post,
              photos: post.photos ?? null
            })),
            participant.joinedAt
          );

          // Calculate score using unified scoring system
          const now = new Date();
          const nowUTC = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
          const joinedAtUTC = new Date(new Date(participant.joinedAt).getUTCFullYear(), new Date(participant.joinedAt).getUTCMonth(), new Date(participant.joinedAt).getUTCDate());
          const daysElapsed = Math.max(1, Math.ceil((nowUTC.getTime() - joinedAtUTC.getTime()) / (1000 * 60 * 60 * 24)));

          const score = calculateChallengeScore(metrics, daysElapsed);

          // Last active
          const lastActive = participant.posts.length > 0
            ? participant.posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
            : null;

          return {
            ...participant,
            user: userInfo,
            metrics: {
              totalPosts: metrics.totalPosts,
              avgSleepHours: metrics.avgSleepHours,
              avgMood: metrics.avgMood,
              avgEnergy: metrics.avgEnergy,
              consistency: metrics.consistency,
              lastActive
            },
            score
          };
        })
      );

      setParticipants(enhanced);
    } catch (error) {
      console.error('Error enhancing participants:', error);
    } finally {
      setLoading(false);
    }
  };


  const getScoreColor = (score: number) => {
    if (score >= 80) return "success";
    if (score >= 60) return "primary";
    if (score >= 40) return "warning";
    return "danger";
  };

  const getConsistencyColor = (consistency: number) => {
    if (consistency >= 80) return "success";
    if (consistency >= 60) return "primary";
    if (consistency >= 40) return "warning";
    return "danger";
  };

  const filteredParticipants = participants
    .filter(participant =>
      participant.user.firstName.toLowerCase().includes(searchValue.toLowerCase()) ||
      participant.user.lastName.toLowerCase().includes(searchValue.toLowerCase()) ||
      participant.user.email.toLowerCase().includes(searchValue.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "score":
          return b.score - a.score;
        case "posts":
          return b.metrics.totalPosts - a.metrics.totalPosts;
        case "consistency":
          return b.metrics.consistency - a.metrics.consistency;
        case "name":
          return `${a.user.firstName} ${a.user.lastName}`.localeCompare(`${b.user.firstName} ${b.user.lastName}`);
        case "lastActive":
          if (!a.metrics.lastActive && !b.metrics.lastActive) return 0;
          if (!a.metrics.lastActive) return 1;
          if (!b.metrics.lastActive) return -1;
          return new Date(b.metrics.lastActive).getTime() - new Date(a.metrics.lastActive).getTime();
        default:
          return 0;
      }
    });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  };

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return "Never";
    const diff = Date.now() - new Date(dateString).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-foreground-500">Loading participant details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Input
          placeholder="Search participants..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          startContent={<IconSearch size={18} />}
          className="max-w-xs"
        />

        <Dropdown>
          <DropdownTrigger>
            <Button variant="flat" startContent={<IconFilter size={18} />}>
              Sort by: {sortBy}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            selectedKeys={[sortBy]}
            onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as string)}
          >
            <DropdownItem key="score">Overall Score</DropdownItem>
            <DropdownItem key="posts">Total Posts</DropdownItem>
            <DropdownItem key="consistency">Consistency</DropdownItem>
            <DropdownItem key="name">Name</DropdownItem>
            <DropdownItem key="lastActive">Last Active</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>

      {/* Participants Table */}
      <Table aria-label="Participants table" shadow="sm">
        <TableHeader>
          <TableColumn>PARTICIPANT</TableColumn>
          <TableColumn>SCORE</TableColumn>
          <TableColumn>POSTS</TableColumn>
          <TableColumn>CONSISTENCY</TableColumn>
          <TableColumn>WELLNESS</TableColumn>
          <TableColumn>LAST ACTIVE</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody>
          {filteredParticipants.map((participant, index) => (
            <TableRow key={participant.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground-500">#{index + 1}</span>
                    <Avatar
                      src={participant.user.imageUrl}
                      name={`${participant.user.firstName} ${participant.user.lastName}`}
                      size="sm"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {participant.user.firstName} {participant.user.lastName}
                    </p>
                    <p className="text-xs text-foreground-500">{participant.user.email}</p>
                    <p className="text-xs text-foreground-400">
                      Joined {formatDate(participant.joinedAt)}
                    </p>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <div className="space-y-1">
                  <Chip
                    color={getScoreColor(participant.score)}
                    variant="flat"
                    size="sm"
                  >
                    {Math.round(participant.score)} pts
                  </Chip>
                  <Progress
                    value={participant.score}
                    maxValue={100}
                    size="sm"
                    color={getScoreColor(participant.score)}
                    className="w-20"
                  />
                </div>
              </TableCell>

              <TableCell>
                <div className="text-center">
                  <p className="font-bold text-lg">{participant.metrics.totalPosts}</p>
                  <p className="text-xs text-foreground-500">posts</p>
                </div>
              </TableCell>

              <TableCell>
                <div className="space-y-1">
                  <Chip
                    color={getConsistencyColor(participant.metrics.consistency)}
                    variant="flat"
                    size="sm"
                  >
                    {Math.round(participant.metrics.consistency)}%
                  </Chip>
                  <Progress
                    value={participant.metrics.consistency}
                    maxValue={100}
                    size="sm"
                    color={getConsistencyColor(participant.metrics.consistency)}
                    className="w-20"
                  />
                </div>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <IconMoon size={12} className="text-blue-500" />
                    <span>{participant.metrics.avgSleepHours.toFixed(1)}h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconMoodHappy size={12} className="text-green-500" />
                    <span>{participant.metrics.avgMood.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconBolt size={12} className="text-yellow-500" />
                    <span>{participant.metrics.avgEnergy.toFixed(1)}</span>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {formatTimeAgo(participant.metrics.lastActive)}
                  </p>
                  <p className="text-xs text-foreground-500">
                    {formatDate(participant.metrics.lastActive)}
                  </p>
                </div>
              </TableCell>

              <TableCell>
                <Button
                  size="sm"
                  variant="flat"
                  color="primary"
                  startContent={<IconEye size={16} />}
                  onPress={() => router.push(`/admin/ninety-day-challenge/participants/${participant.id}`)}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {filteredParticipants.length === 0 && (
        <div className="text-center py-8">
          <p className="text-foreground-500">
            {searchValue ? "No participants found matching your search." : "No participants in this challenge yet."}
          </p>
        </div>
      )}
    </div>
  );
}