"use client";

import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { Chip } from "@nextui-org/chip";
import { IconCalendar, IconUsers, IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";
import { format } from "date-fns";

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
}

interface ChallengeSelectionProps {
  challenges: Challenge[];
}

export function ChallengeSelection({ challenges }: ChallengeSelectionProps) {
  const getDaysRemaining = (endDate: Date) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getDaysElapsed = (startDate: Date) => {
    const now = new Date();
    const start = new Date(startDate);
    const diffTime = now.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.min(90, diffDays + 1));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-200 mb-4">
            Select Your Challenge
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            You're participating in multiple challenges. Choose which one you'd like to view.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {challenges.map((challenge) => {
            const daysRemaining = getDaysRemaining(challenge.endDate);
            const daysElapsed = getDaysElapsed(challenge.startDate);
            const progressPercentage = (daysElapsed / 90) * 100;

            return (
              <Card
                key={challenge.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                isPressable
              >
                <CardHeader className="flex flex-col items-start gap-3 pb-4">
                  <div className="flex justify-between items-start w-full">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">
                        {challenge.title}
                      </h3>
                      {challenge.description && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                          {challenge.description}
                        </p>
                      )}
                    </div>
                    <Chip
                      color={daysRemaining > 0 ? "success" : "default"}
                      variant="flat"
                      size="sm"
                    >
                      {daysRemaining > 0 ? "Active" : "Completed"}
                    </Chip>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-zinc-500">
                    <div className="flex items-center gap-1">
                      <IconCalendar size={16} />
                      <span>
                        {format(new Date(challenge.startDate), 'MMM d')} - {format(new Date(challenge.endDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardBody className="pt-0">
                  {/* Progress Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {daysElapsed}
                      </div>
                      <div className="text-xs text-zinc-500">Days Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-secondary">
                        {Math.round(progressPercentage)}%
                      </div>
                      <div className="text-xs text-zinc-500">Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-warning">
                        {daysRemaining}
                      </div>
                      <div className="text-xs text-zinc-500">Days Left</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 mb-4">
                    <div
                      className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, progressPercentage)}%` }}
                    />
                  </div>

                  {/* Enter Button */}
                  <Button
                    as={Link}
                    href={`/ninety-day-challenge?challengeId=${challenge.id}`}
                    color="primary"
                    variant="flat"
                    className="w-full"
                    endContent={<IconArrowRight size={16} />}
                  >
                    Enter Challenge
                  </Button>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 text-center">
          <p className="text-sm text-zinc-500 mb-4">
            You can also view community posts from any challenge:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {challenges.map((challenge) => (
              <Button
                key={`posts-${challenge.id}`}
                as={Link}
                href={`/ninety-day-challenge/posts?challengeId=${challenge.id}`}
                variant="bordered"
                size="sm"
              >
                {challenge.title} Posts
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}