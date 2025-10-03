"use client";

import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { User } from "@nextui-org/user";
import { Chip } from "@nextui-org/chip";
import { Button } from "@nextui-org/button";
import { Switch } from "@nextui-org/switch";
import { useState } from "react";
import { IconEdit, IconTrash } from "@tabler/icons-react";

interface Participant {
  id: string;
  userId: string;
  isEnabled: boolean;
  joinedAt: string;
  completedDays: number;
  lastActiveDate: string | null;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    imageUrl: string;
    username: string;
  };
  challenge: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
  };
}

interface Props {
  participant: Participant;
}

export function ParticipantDetails({ participant }: Props) {
  const [isEnabled, setIsEnabled] = useState(participant.isEnabled);
  const [loading, setLoading] = useState(false);

  const handleToggleEnabled = async (value: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/ninety-day-challenge/participants/${participant.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isEnabled: value }),
      });

      if (response.ok) {
        setIsEnabled(value);
      }
    } catch (error) {
      console.error('Error updating participant:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveParticipant = async () => {
    if (!confirm('Are you sure you want to remove this participant from the challenge?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/ninety-day-challenge/participants/${participant.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        window.location.href = '/admin/ninety-day-challenge';
      }
    } catch (error) {
      console.error('Error removing participant:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Participant Details</h3>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* User Info */}
        <User
          name={`${participant.user.firstName} ${participant.user.lastName}`}
          description={participant.user.email}
          avatarProps={{
            src: participant.user.imageUrl,
            size: "lg",
          }}
          classNames={{ description: "text-zinc-500" }}
        />

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Challenge Access:</span>
          <div className="flex items-center gap-2">
            <Chip
              color={isEnabled ? "success" : "default"}
              size="sm"
            >
              {isEnabled ? "Enabled" : "Disabled"}
            </Chip>
            <Switch
              size="sm"
              isSelected={isEnabled}
              onValueChange={handleToggleEnabled}
              isDisabled={loading}
            />
          </div>
        </div>

        {/* Challenge Info */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">Challenge:</span>
            <span className="font-medium">{participant.challenge.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">Joined:</span>
            <span className="font-medium">{new Date(participant.joinedAt).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">Days Completed:</span>
            <span className="font-medium">{participant.completedDays}</span>
          </div>
          {participant.lastActiveDate && (
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Last Active:</span>
              <span className="font-medium">{new Date(participant.lastActiveDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Challenge Duration */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">Challenge Start:</span>
            <span className="font-medium">{new Date(participant.challenge.startDate).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">Challenge End:</span>
            <span className="font-medium">{new Date(participant.challenge.endDate).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button
            size="sm"
            color="danger"
            variant="flat"
            startContent={<IconTrash size={16} />}
            onPress={handleRemoveParticipant}
            className="flex-1"
          >
            Remove from Challenge
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}