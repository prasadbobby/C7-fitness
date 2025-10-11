"use client";
import React, { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRestTimer } from "@/contexts/RestTimerContext";
import { useWorkoutControls } from "@/contexts/WorkoutControlsContext";
import { Button, ButtonGroup } from "@nextui-org/button";
import { Card, CardBody } from "@nextui-org/card";
import { Chip } from "@nextui-org/chip";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@nextui-org/popover";
import {
  IconClock,
  IconPlayerStop,
  IconPlus,
  IconPlayerPlay,
  IconPlayerPause,
} from "@tabler/icons-react";

interface FloatingTimerButtonProps {
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  showOnlyWhenActive?: boolean;
}

export const FloatingTimerButton: React.FC<FloatingTimerButtonProps> = ({
  position = "bottom-right",
  showOnlyWhenActive = true,
}) => {
  const { userId } = useAuth();
  const restTimer = useRestTimer();
  const workoutControls = useWorkoutControls();
  const [isOpen, setIsOpen] = useState(false);

  const currentRestTimer = userId ? restTimer.getRestTimerForUser(userId) : undefined;
  const hasActiveWorkout = workoutControls.workoutStartTime !== null;

  // Don't show if no active timers and showOnlyWhenActive is true
  if (showOnlyWhenActive && !currentRestTimer && !hasActiveWorkout) {
    return null;
  }

  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-20 sm:top-6 right-6", // Ensure it's below mobile navbar
    "top-left": "top-20 sm:top-6 left-6",   // Ensure it's below mobile navbar
  };

  const quickRestTimes = [45, 60, 90, 120, 180, 300]; // 45s, 1min, 1.5min, 2min, 3min, 5min

  const startQuickRest = (duration: number) => {
    if (userId) {
      restTimer.startRestTimer(
        userId,
        "manual",
        "Quick Rest",
        1,
        duration,
        false
      );
    }
    setIsOpen(false);
  };

  const stopCurrentRest = () => {
    if (currentRestTimer) {
      restTimer.stopRestTimer(currentRestTimer.id);
    }
    setIsOpen(false);
  };

  const extendCurrentRest = (additionalSeconds: number) => {
    if (currentRestTimer) {
      restTimer.extendRestTimer(currentRestTimer.id, additionalSeconds);
    }
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-[60]`}>
      <Popover
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        placement={position.includes("bottom") ? "top" : "bottom"}
      >
        <PopoverTrigger>
          <Button
            color={currentRestTimer ? "warning" : "primary"}
            variant={currentRestTimer ? "solid" : "shadow"}
            size="lg"
            className="rounded-full h-14 w-14 shadow-lg"
            isIconOnly
          >
            <IconClock size={24} />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80">
          <Card shadow="none" className="border-none">
            <CardBody className="space-y-4">
              {/* Active Rest Timer */}
              {currentRestTimer && (
                <div className="space-y-3">
                  <div className="text-center">
                    <Chip color="warning" className="mb-2">
                      Rest Timer Active
                    </Chip>
                    <div className="text-lg font-mono">
                      {restTimer.formatTime(currentRestTimer.duration)} / {restTimer.formatTime(currentRestTimer.targetDuration)}
                    </div>
                    <div className="text-sm text-default-500">
                      {currentRestTimer.exerciseName} - Set {currentRestTimer.setNumber}
                    </div>
                  </div>

                  <div className="flex gap-2 justify-center">
                    <Button
                      size="sm"
                      color={currentRestTimer.isPaused ? "primary" : "warning"}
                      onPress={() => currentRestTimer.isPaused
                        ? restTimer.resumeRestTimer(currentRestTimer.id)
                        : restTimer.pauseRestTimer(currentRestTimer.id)
                      }
                    >
                      {currentRestTimer.isPaused ? (
                        <IconPlayerPlay size={14} />
                      ) : (
                        <IconPlayerPause size={14} />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      color="success"
                      onPress={stopCurrentRest}
                    >
                      <IconPlayerStop size={14} />
                    </Button>
                    <Button
                      size="sm"
                      color="secondary"
                      onPress={() => extendCurrentRest(30)}
                    >
                      <IconPlus size={14} />
                    </Button>
                  </div>
                </div>
              )}

              {/* Quick Rest Start */}
              {!currentRestTimer && (
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-sm font-medium mb-2">Quick Rest Timer</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {quickRestTimes.map((duration) => {
                      const formatDuration = (seconds: number) => {
                        if (seconds < 60) return `${seconds}s`;
                        if (seconds === 60) return "1min";
                        if (seconds === 90) return "1.5min";
                        return `${seconds / 60}min`;
                      };

                      return (
                        <Button
                          key={duration}
                          size="sm"
                          variant="flat"
                          onPress={() => startQuickRest(duration)}
                        >
                          {formatDuration(duration)}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Workout Timer Info */}
              {hasActiveWorkout && (
                <div className="border-t pt-3">
                  <div className="text-center">
                    <div className="text-sm text-default-500 mb-1">Workout Time</div>
                    <div className="font-mono">
                      {workoutControls.formatDuration(workoutControls.workoutDuration)}
                    </div>
                    <div className="text-xs text-default-500 mt-1">
                      Active: {workoutControls.formatDuration(Math.max(0, workoutControls.workoutDuration - workoutControls.totalRestTime))} |
                      Rest: {workoutControls.formatDuration(workoutControls.totalRestTime)}
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
};