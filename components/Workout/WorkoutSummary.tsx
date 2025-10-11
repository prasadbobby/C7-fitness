"use client";
import React from "react";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { Chip } from "@nextui-org/chip";
import { Progress } from "@nextui-org/progress";
import { Divider } from "@nextui-org/divider";
import {
  IconClock,
  IconClockPause,
  IconTrophy,
  IconActivity,
  IconCalendar,
  IconShare,
  IconDownload,
} from "@tabler/icons-react";

export interface WorkoutSummaryData {
  workoutName: string;
  date: Date;
  totalDuration: number; // seconds
  totalRestTime: number; // seconds
  totalActiveTime: number; // seconds
  exercisesCompleted: number;
  totalSets: number;
  completedSets: number;
  exercises: {
    name: string;
    sets: number;
    completedSets: number;
    bestSet?: {
      weight: number;
      reps: number;
    };
    totalRestTime: number;
  }[];
  personalRecords?: {
    exercise: string;
    previousBest: string;
    newBest: string;
  }[];
}

interface WorkoutSummaryProps {
  data: WorkoutSummaryData;
  onShare?: () => void;
  onDownload?: () => void;
  onClose?: () => void;
  showActions?: boolean;
}

export const WorkoutSummary: React.FC<WorkoutSummaryProps> = ({
  data,
  onShare,
  onDownload,
  onClose,
  showActions = true,
}) => {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds - hours * 3600) / 60);
    const remainingSeconds = seconds - hours * 3600 - minutes * 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  };

  const completionRate = (data.completedSets / data.totalSets) * 100;
  const activePercentage = (data.totalActiveTime / data.totalDuration) * 100;
  const restPercentage = (data.totalRestTime / data.totalDuration) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="text-center">
          <div className="w-full">
            <div className="flex items-center justify-center gap-2 mb-2">
              <IconTrophy className="text-warning" size={24} />
              <h1 className="text-2xl font-bold">Workout Complete!</h1>
            </div>
            <h2 className="text-xl text-primary">{data.workoutName}</h2>
            <p className="text-sm text-default-500">
              <IconCalendar size={16} className="inline mr-1" />
              {data.date.toLocaleDateString()} at {data.date.toLocaleTimeString()}
            </p>
          </div>
        </CardHeader>
      </Card>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody className="text-center">
            <IconClock className="mx-auto mb-2 text-primary" size={32} />
            <div className="text-2xl font-bold">{formatTime(data.totalDuration)}</div>
            <div className="text-sm text-default-500">Total Time</div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <IconActivity className="mx-auto mb-2 text-success" size={32} />
            <div className="text-2xl font-bold">{formatTime(data.totalActiveTime)}</div>
            <div className="text-sm text-default-500">Active Time</div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <IconClockPause className="mx-auto mb-2 text-warning" size={32} />
            <div className="text-2xl font-bold">{formatTime(data.totalRestTime)}</div>
            <div className="text-sm text-default-500">Rest Time</div>
          </CardBody>
        </Card>
      </div>

      {/* Time Breakdown */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Time Breakdown</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Active Time ({activePercentage.toFixed(1)}%)</span>
              <span className="text-sm font-mono">{formatTime(data.totalActiveTime)}</span>
            </div>
            <Progress
              value={activePercentage}
              color="success"
              size="sm"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Rest Time ({restPercentage.toFixed(1)}%)</span>
              <span className="text-sm font-mono">{formatTime(data.totalRestTime)}</span>
            </div>
            <Progress
              value={restPercentage}
              color="warning"
              size="sm"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-xl font-bold text-primary">{data.exercisesCompleted}</div>
              <div className="text-xs text-default-500">Exercises</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-success">{data.completedSets}</div>
              <div className="text-xs text-default-500">Sets Completed</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{completionRate.toFixed(0)}%</div>
              <div className="text-xs text-default-500">Completion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-warning">
                {Math.round(data.totalActiveTime / 60 / data.exercisesCompleted)}min
              </div>
              <div className="text-xs text-default-500">Avg per Exercise</div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Personal Records */}
      {data.personalRecords && data.personalRecords.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconTrophy className="text-warning" size={20} />
              <h3 className="text-lg font-semibold">New Personal Records!</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {data.personalRecords.map((pr, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
                  <div>
                    <div className="font-semibold">{pr.exercise}</div>
                    <div className="text-sm text-default-500">
                      Previous: {pr.previousBest}
                    </div>
                  </div>
                  <div className="text-right">
                    <Chip color="warning" variant="flat">
                      {pr.newBest}
                    </Chip>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Exercise Breakdown */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Exercise Summary</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {data.exercises.map((exercise, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">{exercise.name}</h4>
                    <p className="text-sm text-default-500">
                      {exercise.completedSets} of {exercise.sets} sets completed
                    </p>
                  </div>
                  <div className="text-right">
                    <Chip
                      color={exercise.completedSets === exercise.sets ? "success" : "warning"}
                      size="sm"
                    >
                      {Math.round((exercise.completedSets / exercise.sets) * 100)}%
                    </Chip>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {exercise.bestSet && (
                    <div>
                      <span className="text-default-500">Best Set:</span>
                      <span className="ml-2 font-semibold">
                        {exercise.bestSet.weight}kg × {exercise.bestSet.reps}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-default-500">Rest Time:</span>
                    <span className="ml-2 font-mono">
                      {formatTime(exercise.totalRestTime)}
                    </span>
                  </div>
                </div>

                <Progress
                  value={(exercise.completedSets / exercise.sets) * 100}
                  color={exercise.completedSets === exercise.sets ? "success" : "warning"}
                  size="sm"
                  className="mt-3"
                />
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Actions */}
      {showActions && (
        <Card>
          <CardBody>
            <div className="flex flex-wrap gap-3 justify-center">
              {onShare && (
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<IconShare size={16} />}
                  onPress={onShare}
                >
                  Share Workout
                </Button>
              )}
              {onDownload && (
                <Button
                  color="secondary"
                  variant="flat"
                  startContent={<IconDownload size={16} />}
                  onPress={onDownload}
                >
                  Download Report
                </Button>
              )}
              {onClose && (
                <Button
                  color="success"
                  onPress={onClose}
                >
                  Continue
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};