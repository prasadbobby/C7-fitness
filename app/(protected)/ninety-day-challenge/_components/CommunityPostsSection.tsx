"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { useDisclosure } from "@nextui-org/modal";
import { IconWorldStar, IconUsers, IconMessageCircle } from "@tabler/icons-react";
import BottomSheet from "@/components/UI/BottomSheet";
import { CommunityFeed } from "./CommunityFeed";

interface CommunityPostsSectionProps {
  challengeId: string | null;
}

export function CommunityPostsSection({ challengeId }: CommunityPostsSectionProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  if (!challengeId) {
    return null;
  }

  return (
    <>
      {/* Community Posts Preview Section */}
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
            color="primary"
            variant="shadow"
            startContent={<IconMessageCircle size={18} />}
            onPress={onOpen}
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

      {/* Full Community Feed Modal */}
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Community Posts"
        subtitle="All posts from challenge participants"
        size="5xl"
      >
        <div className="space-y-4">
          {/* Community Guidelines */}
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
            <h4 className="font-semibold text-primary-700 dark:text-primary-300 mb-2">
              Community Guidelines
            </h4>
            <ul className="text-sm text-primary-600 dark:text-primary-400 space-y-1">
              <li>• Be supportive and encouraging to fellow participants</li>
              <li>• Share your genuine experiences and progress</li>
              <li>• Celebrate others' achievements and milestones</li>
              <li>• Keep discussions positive and motivational</li>
            </ul>
          </div>

          {/* Community Feed */}
          <CommunityFeed challengeId={challengeId} />
        </div>
      </BottomSheet>
    </>
  );
}