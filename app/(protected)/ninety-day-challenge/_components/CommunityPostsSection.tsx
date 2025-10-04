"use client";

import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { IconWorldStar, IconUsers, IconMessageCircle } from "@tabler/icons-react";
import Link from "next/link";

interface CommunityPostsSectionProps {
  challengeId: string | null;
}

export function CommunityPostsSection({ challengeId }: CommunityPostsSectionProps) {
  if (!challengeId) {
    return null;
  }

  return (
    <Card shadow="none" className="bg-gradient-to-br from-background to-default-50 border border-divider shadow-xl">
      <CardHeader className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl shadow-lg">
            <IconWorldStar className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Community Posts
            </h2>
            <p className="text-sm text-foreground-500">
              Connect with fellow participants and share your journey
            </p>
          </div>
        </div>
        <Button
          as={Link}
          href="/ninety-day-challenge/posts"
          color="primary"
          variant="shadow"
          startContent={<IconMessageCircle size={18} />}
          className="font-medium"
        >
          View All Posts
        </Button>
      </CardHeader>
      <CardBody className="pt-0">
        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-800 rounded-full flex items-center justify-center">
                <IconUsers className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                Join the Community Discussion
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Share your progress, get motivated by others' achievements, and support fellow participants on their transformation journey. Click "View All Posts" to see the full community feed.
              </p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}