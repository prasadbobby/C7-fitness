"use client";
import { usePathname } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import { useWorkoutTimerIntegration } from "@/hooks/useWorkoutTimerIntegration";
import { Button, ButtonGroup } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";
import { Progress } from "@nextui-org/progress";
import {
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerStop,
  IconClock,
  IconClockPause
} from "@tabler/icons-react";
import clsx from "clsx";

export default function SidebarWorkoutControls() {
  const {
    workoutControls,
    restTimer,
    currentRestTimer,
    stopCurrentRestTimer,
  } = useWorkoutTimerIntegration();

  const pathname = usePathname();
  const workoutPath = `/workout/${workoutControls.activeWorkoutRoutine}`;
  const formattedStartTime = workoutControls.workoutStartTime
    ? format(new Date(workoutControls.workoutStartTime), "HH:mm")
    : "N/A";

  const handlePauseToggle = () => {
    workoutControls.togglePause();
  };

  return (
    <>
      {workoutControls.workoutStartTime !== null && (
        <div className="px-5">
          <Divider />
          <div className="px-3 py-3 rounded-lg space-y-4">
            {/* Main Workout Timer */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <IconClock size={16} />
                <span className="text-sm font-medium">
                  {workoutControls.isPaused ? "Workout Paused" : "Active Workout"}
                </span>
              </div>
              <div
                className={clsx("text-center text-2xl mb-2 tracking-tight font-mono", {
                  "text-warning": workoutControls.isPaused,
                  "text-primary": !workoutControls.isPaused,
                })}
              >
                {workoutControls.formatDuration(workoutControls.workoutDuration)}
              </div>

              {/* Workout summary */}
              <div className="text-xs text-default-500 mb-2">
                Active: {workoutControls.formatDuration(Math.max(0, workoutControls.workoutDuration - workoutControls.totalRestTime))} |
                Rest: {workoutControls.formatDuration(workoutControls.totalRestTime)}
              </div>
            </div>

            {/* Rest Timer (if active) */}
            {currentRestTimer && (
              <div className="border-t pt-3">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <IconClockPause size={16} />
                    <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                      Rest Timer
                    </span>
                  </div>

                  <div className="text-lg font-mono text-orange-600 dark:text-orange-400 mb-1">
                    {restTimer.formatTime(currentRestTimer.duration)} / {restTimer.formatTime(currentRestTimer.targetDuration)}
                  </div>

                  <div className="text-xs text-default-500 mb-2">
                    {currentRestTimer.exerciseName} - Set {currentRestTimer.setNumber}
                  </div>

                  {/* Rest timer progress */}
                  <Progress
                    value={(currentRestTimer.duration / currentRestTimer.targetDuration) * 100}
                    color={currentRestTimer.duration >= currentRestTimer.targetDuration ? "success" : "warning"}
                    size="sm"
                    className="mb-2"
                  />

                  {/* Rest timer controls */}
                  <div className="flex gap-1 justify-center">
                    <Button
                      size="sm"
                      variant="flat"
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
                      variant="flat"
                      color="success"
                      onPress={stopCurrentRestTimer}
                    >
                      <IconPlayerStop size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Main workout controls */}
            <div className="flex justify-center gap-x-2">
              <Button
                color={workoutControls.isPaused ? "default" : "warning"}
                onPress={handlePauseToggle}
                size="sm"
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
            </div>

            {/* Navigation and info */}
            {workoutPath !== pathname && (
              <div className="text-center text-sm text-primary">
                <Link href={workoutPath}>View Details</Link>
              </div>
            )}
            <div className="text-center text-xs text-default-500">
              Started: {formattedStartTime}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
