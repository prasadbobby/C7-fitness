"use client";
import React, { useState } from "react";
import { useRestTimer } from "@/contexts/RestTimerContext";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { Chip } from "@nextui-org/chip";
import { Progress } from "@nextui-org/progress";
import {
  IconClock,
  IconUsers,
  IconPlayerStop,
  IconExternalLink,
} from "@tabler/icons-react";
import Link from "next/link";

interface GymMasterWidgetProps {
  maxHeight?: string;
}

export const GymMasterWidget: React.FC<GymMasterWidgetProps> = ({
  maxHeight = "400px"
}) => {
  const restTimer = useRestTimer();
  const allActiveSessions = restTimer.getAllActiveSessions();
  const activeRestTimers = Array.from(restTimer.activeRestTimers.values());

  const stopUserTimer = (timerId: string) => {
    restTimer.stopRestTimer(timerId);
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Gym Master</h3>
          <p className="text-sm text-default-500">Quick overview</p>
        </div>
        <Link href="/admin/gym-master">
          <Button
            size="sm"
            variant="flat"
            endContent={<IconExternalLink size={14} />}
          >
            Full View
          </Button>
        </Link>
      </CardHeader>

      <CardBody style={{ maxHeight, overflowY: "auto" }}>
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <div className="text-xl font-bold text-primary">
              {allActiveSessions.length}
            </div>
            <div className="text-xs text-default-500">Active Users</div>
          </div>
          <div className="text-center p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
            <div className="text-xl font-bold text-warning">
              {activeRestTimers.length}
            </div>
            <div className="text-xs text-default-500">Rest Timers</div>
          </div>
        </div>

        {/* Active Sessions */}
        {allActiveSessions.length === 0 ? (
          <div className="text-center py-6">
            <IconUsers size={32} className="mx-auto mb-2 text-default-300" />
            <p className="text-sm text-default-500">No active sessions</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Active Sessions</h4>
            {allActiveSessions.slice(0, 5).map((session) => (
              <div
                key={session.userId}
                className="p-3 border rounded-lg space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{session.userName}</p>
                    <Chip
                      color={
                        session.status === "RESTING"
                          ? "warning"
                          : session.status === "ACTIVE"
                          ? "success"
                          : "default"
                      }
                      size="sm"
                      className="mt-1"
                    >
                      {session.status}
                    </Chip>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-default-500">
                      {restTimer.formatTime(session.totalWorkoutDuration)}
                    </div>
                  </div>
                </div>

                {session.restTimer && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Rest Timer</span>
                      <span className="text-xs font-mono">
                        {restTimer.formatTime(session.restTimer.duration)} /
                        {restTimer.formatTime(session.restTimer.targetDuration)}
                      </span>
                    </div>
                    <Progress
                      value={
                        (session.restTimer.duration / session.restTimer.targetDuration) * 100
                      }
                      color="warning"
                      size="sm"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-default-500">
                        {session.restTimer.exerciseName}
                      </span>
                      <Button
                        size="sm"
                        variant="flat"
                        color="success"
                        onPress={() => stopUserTimer(session.restTimer!.id)}
                      >
                        <IconPlayerStop size={12} />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {allActiveSessions.length > 5 && (
              <div className="text-center">
                <Link href="/admin/gym-master">
                  <Button size="sm" variant="flat">
                    View All ({allActiveSessions.length - 5} more)
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
};