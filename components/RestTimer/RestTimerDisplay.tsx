"use client";
import React from "react";
import { Button, ButtonGroup } from "@nextui-org/button";
import { Card, CardBody } from "@nextui-org/card";
import { Progress } from "@nextui-org/progress";
import {
  IconPlayerStopFilled,
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconPlus,
  IconX,
} from "@tabler/icons-react";
import { useRestTimer } from "@/contexts/RestTimerContext";

interface RestTimerDisplayProps {
  userId: string;
  showControls?: boolean;
  compact?: boolean;
}

export const RestTimerDisplay: React.FC<RestTimerDisplayProps> = ({
  userId,
  showControls = true,
  compact = false,
}) => {
  const restTimer = useRestTimer();
  const currentRestTimer = restTimer.getRestTimerForUser(userId);

  if (!currentRestTimer) {
    return null;
  }

  const progressPercentage = (currentRestTimer.duration / currentRestTimer.targetDuration) * 100;
  const remainingTime = Math.max(0, currentRestTimer.targetDuration - currentRestTimer.duration);
  const isNearEnd = remainingTime <= 10 && remainingTime > 0;
  const isCompleted = currentRestTimer.duration >= currentRestTimer.targetDuration;

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
        <div className="text-sm">
          <div className="font-mono text-orange-600 dark:text-orange-400">
            {restTimer.formatTime(currentRestTimer.duration)} / {restTimer.formatTime(currentRestTimer.targetDuration)}
          </div>
          <div className="text-xs text-default-500">
            {currentRestTimer.exerciseName} - Set {currentRestTimer.setNumber}
          </div>
        </div>
        {showControls && (
          <Button
            size="sm"
            isIconOnly
            color="danger"
            variant="flat"
            onPress={() => restTimer.stopRestTimer(currentRestTimer.id)}
          >
            <IconX size={16} />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={`${isNearEnd ? 'border-warning' : isCompleted ? 'border-success' : 'border-orange-500'}`}>
      <CardBody className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-semibold text-orange-600 dark:text-orange-400">
              Rest Timer
            </h3>
            <p className="text-sm text-default-500">
              {currentRestTimer.exerciseName} - Set {currentRestTimer.setNumber}
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-mono text-orange-600 dark:text-orange-400">
              {restTimer.formatTime(currentRestTimer.duration)}
            </div>
            <div className="text-sm text-default-500">
              / {restTimer.formatTime(currentRestTimer.targetDuration)}
            </div>
          </div>
        </div>

        <Progress
          value={progressPercentage}
          color={isCompleted ? "success" : isNearEnd ? "warning" : "primary"}
          className="mb-4"
          size="md"
        />

        {isCompleted && (
          <div className="text-center mb-3">
            <p className="text-success font-semibold">Rest Complete! 🎉</p>
          </div>
        )}

        {isNearEnd && !isCompleted && (
          <div className="text-center mb-3">
            <p className="text-warning font-semibold">
              {remainingTime} seconds remaining!
            </p>
          </div>
        )}

        {showControls && (
          <div className="flex gap-2">
            <ButtonGroup variant="flat" className="flex-1">
              <Button
                color={currentRestTimer.isPaused ? "primary" : "warning"}
                onPress={() => currentRestTimer.isPaused
                  ? restTimer.resumeRestTimer(currentRestTimer.id)
                  : restTimer.pauseRestTimer(currentRestTimer.id)
                }
                className="flex-1"
              >
                {currentRestTimer.isPaused ? (
                  <>
                    <IconPlayerPlayFilled size={16} />
                    Resume
                  </>
                ) : (
                  <>
                    <IconPlayerPauseFilled size={16} />
                    Pause
                  </>
                )}
              </Button>

              <Button
                color="success"
                onPress={() => restTimer.stopRestTimer(currentRestTimer.id)}
                className="flex-1"
              >
                <IconPlayerStopFilled size={16} />
                Stop Rest
              </Button>
            </ButtonGroup>

            <ButtonGroup variant="flat">
              <Button
                color="secondary"
                isIconOnly
                onPress={() => restTimer.extendRestTimer(currentRestTimer.id, 30)}
                title="Add 30 seconds"
              >
                <IconPlus size={16} />
              </Button>

              <Button
                color="danger"
                isIconOnly
                onPress={() => restTimer.skipRestTimer(currentRestTimer.id)}
                title="Skip rest"
              >
                <IconX size={16} />
              </Button>
            </ButtonGroup>
          </div>
        )}

        {currentRestTimer.autoStarted && (
          <p className="text-xs text-default-400 mt-2 text-center">
            Auto-started after set completion
          </p>
        )}
      </CardBody>
    </Card>
  );
};