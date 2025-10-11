"use client";
import React, { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useWorkoutControls } from "@/contexts/WorkoutControlsContext";
import { useRestTimer } from "@/contexts/RestTimerContext";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Button, ButtonGroup } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { Switch } from "@nextui-org/switch";
import { Slider } from "@nextui-org/slider";
import { Progress } from "@nextui-org/progress";
import { Chip } from "@nextui-org/chip";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@nextui-org/modal";
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerStop,
  IconPlus,
  IconMinus,
  IconClock,
  IconSettings,
  IconVolume,
  IconVolumeOff,
  IconRefresh,
} from "@tabler/icons-react";

interface TimerControlPanelProps {
  mode?: "user" | "admin" | "embedded";
  userId?: string; // For admin mode to control specific user
  showWorkoutControls?: boolean;
  showRestControls?: boolean;
  showSettings?: boolean;
  compact?: boolean;
}

export const TimerControlPanel: React.FC<TimerControlPanelProps> = ({
  mode = "user",
  userId: targetUserId,
  showWorkoutControls = true,
  showRestControls = true,
  showSettings = true,
  compact = false,
}) => {
  const { userId: currentUserId } = useAuth();
  const workoutControls = useWorkoutControls();
  const restTimer = useRestTimer();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Determine which user we're controlling
  const controlUserId = targetUserId || currentUserId;
  const isAdminMode = mode === "admin" && targetUserId;

  // Timer settings state
  const [customRestTime, setCustomRestTime] = useState(60);
  const [quickRestTimes] = useState([45, 60, 90, 120, 180, 300]); // 45s, 1min, 1.5min, 2min, 3min, 5min

  // Get current timers
  const currentRestTimer = controlUserId ? restTimer.getRestTimerForUser(controlUserId) : undefined;
  const userSession = controlUserId ? restTimer.getUserSession(controlUserId) : undefined;

  // Quick action handlers
  const startQuickRest = (duration: number) => {
    if (controlUserId) {
      restTimer.startRestTimer(
        controlUserId,
        "manual",
        "Quick Rest",
        1,
        duration,
        false
      );
    }
  };

  const extendCurrentRest = (additionalSeconds: number) => {
    if (currentRestTimer) {
      restTimer.extendRestTimer(currentRestTimer.id, additionalSeconds);
    }
  };

  const stopCurrentRest = () => {
    if (currentRestTimer) {
      restTimer.stopRestTimer(currentRestTimer.id);
    }
  };

  if (compact) {
    return (
      <Card className="w-full">
        <CardBody className="p-3">
          <div className="flex items-center justify-between">
            {/* Quick timer status */}
            <div className="flex items-center gap-2">
              {currentRestTimer ? (
                <div className="flex items-center gap-2">
                  <Chip color="warning" size="sm" variant="flat">
                    Rest: {restTimer.formatTime(currentRestTimer.duration)}/{restTimer.formatTime(currentRestTimer.targetDuration)}
                  </Chip>
                  <ButtonGroup size="sm" variant="flat">
                    <Button
                      isIconOnly
                      color="success"
                      onPress={stopCurrentRest}
                    >
                      <IconPlayerStop size={14} />
                    </Button>
                    <Button
                      isIconOnly
                      color="secondary"
                      onPress={() => extendCurrentRest(30)}
                    >
                      <IconPlus size={14} />
                    </Button>
                  </ButtonGroup>
                </div>
              ) : (
                <div className="flex gap-1">
                  {[60, 90, 120].map((duration) => (
                    <Button
                      key={duration}
                      size="sm"
                      variant="flat"
                      onPress={() => startQuickRest(duration)}
                    >
                      {duration}s
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Settings button */}
            {showSettings && (
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                onPress={onOpen}
              >
                <IconSettings size={16} />
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <h3 className="text-lg font-semibold">
              {isAdminMode ? `Timer Controls - ${userSession?.userName || 'User'}` : 'Timer Controls'}
            </h3>
            <div className="flex items-center gap-2">
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                color={restTimer.enableAudio ? "success" : "default"}
                onPress={() => restTimer.setEnableAudio(!restTimer.enableAudio)}
              >
                {restTimer.enableAudio ? <IconVolume size={16} /> : <IconVolumeOff size={16} />}
              </Button>
              {showSettings && (
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  onPress={onOpen}
                >
                  <IconSettings size={16} />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardBody className="space-y-6">
          {/* Workout Controls */}
          {showWorkoutControls && workoutControls.workoutStartTime && (
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <IconClock size={18} />
                Workout Timer
              </h4>

              <div className="flex justify-between items-center">
                <div>
                  <div className="text-2xl font-mono">
                    {workoutControls.formatDuration(workoutControls.workoutDuration)}
                  </div>
                  <div className="text-sm text-default-500">
                    Active: {workoutControls.formatDuration(Math.max(0, workoutControls.workoutDuration - workoutControls.totalRestTime))} |
                    Rest: {workoutControls.formatDuration(workoutControls.totalRestTime)}
                  </div>
                </div>

                <ButtonGroup>
                  <Button
                    color={workoutControls.isPaused ? "primary" : "warning"}
                    onPress={workoutControls.togglePause}
                  >
                    {workoutControls.isPaused ? (
                      <>
                        <IconPlayerPlay size={16} />
                        Resume
                      </>
                    ) : (
                      <>
                        <IconPlayerPause size={16} />
                        Pause
                      </>
                    )}
                  </Button>
                </ButtonGroup>
              </div>
            </div>
          )}

          {/* Rest Timer Controls */}
          {showRestControls && (
            <div className="space-y-4">
              <h4 className="font-semibold">Rest Timer</h4>

              {currentRestTimer ? (
                <div className="space-y-4">
                  {/* Active Rest Timer */}
                  <div className="p-4 border rounded-lg bg-orange-50 dark:bg-orange-900/20">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <div className="font-semibold">{currentRestTimer.exerciseName}</div>
                        <div className="text-sm text-default-500">Set {currentRestTimer.setNumber}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-mono">
                          {restTimer.formatTime(currentRestTimer.duration)}
                        </div>
                        <div className="text-sm text-default-500">
                          / {restTimer.formatTime(currentRestTimer.targetDuration)}
                        </div>
                      </div>
                    </div>

                    <Progress
                      value={(currentRestTimer.duration / currentRestTimer.targetDuration) * 100}
                      color={currentRestTimer.duration >= currentRestTimer.targetDuration ? "success" : "warning"}
                      className="mb-4"
                    />

                    <div className="flex gap-2 flex-wrap">
                      <Button
                        color={currentRestTimer.isPaused ? "primary" : "warning"}
                        onPress={() => currentRestTimer.isPaused
                          ? restTimer.resumeRestTimer(currentRestTimer.id)
                          : restTimer.pauseRestTimer(currentRestTimer.id)
                        }
                      >
                        {currentRestTimer.isPaused ? (
                          <>
                            <IconPlayerPlay size={16} />
                            Resume
                          </>
                        ) : (
                          <>
                            <IconPlayerPause size={16} />
                            Pause
                          </>
                        )}
                      </Button>

                      <Button
                        color="success"
                        onPress={stopCurrentRest}
                      >
                        <IconPlayerStop size={16} />
                        Stop Rest
                      </Button>

                      <ButtonGroup>
                        <Button
                          variant="flat"
                          onPress={() => extendCurrentRest(15)}
                        >
                          +15s
                        </Button>
                        <Button
                          variant="flat"
                          onPress={() => extendCurrentRest(30)}
                        >
                          +30s
                        </Button>
                      </ButtonGroup>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Quick Rest Buttons */}
                  <div>
                    <div className="text-sm font-medium mb-2">Quick Start</div>
                    <div className="flex gap-2 flex-wrap">
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
                            variant="flat"
                            onPress={() => startQuickRest(duration)}
                          >
                            {formatDuration(duration)}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Rest Timer */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Custom Duration</div>
                    <div className="flex gap-2 items-end">
                      <Input
                        type="number"
                        label="Seconds"
                        value={customRestTime.toString()}
                        onChange={(e) => setCustomRestTime(parseInt(e.target.value) || 0)}
                        min={1}
                        max={600}
                        className="max-w-20"
                      />
                      <Button
                        color="primary"
                        onPress={() => startQuickRest(customRestTime)}
                        disabled={customRestTime <= 0}
                      >
                        Start
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Session Info */}
          {userSession && (
            <div className="p-3 bg-default-100 rounded-lg">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Total Workout:</span>
                  <span className="font-mono">{restTimer.formatTime(userSession.totalWorkoutDuration)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Rest:</span>
                  <span className="font-mono">{restTimer.formatTime(userSession.totalRestTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Chip size="sm" color={userSession.status === "ACTIVE" ? "success" : "warning"}>
                    {userSession.status}
                  </Chip>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Settings Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>Timer Settings</ModalHeader>
          <ModalBody className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Audio Notifications</span>
              <Switch
                isSelected={restTimer.enableAudio}
                onValueChange={restTimer.setEnableAudio}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Default Rest Duration</label>
              <Slider
                size="sm"
                step={15}
                minValue={15}
                maxValue={300}
                value={customRestTime}
                onChange={(value) => setCustomRestTime(Array.isArray(value) ? value[0] : value)}
                getValue={(value) => `${Array.isArray(value) ? value[0] : value}s`}
              />
            </div>

            {mode === "admin" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Gym Master Mode</label>
                <Switch
                  isSelected={restTimer.isGymMasterMode}
                  onValueChange={restTimer.setGymMasterMode}
                />
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onPress={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};