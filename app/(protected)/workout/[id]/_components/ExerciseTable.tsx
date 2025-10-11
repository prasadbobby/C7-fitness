"use client";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@nextui-org/table";
import { Input } from "@nextui-org/input";
import { IconSquareCheck, IconClock, IconPlayerStop } from "@tabler/icons-react";
import { Checkbox } from "@nextui-org/checkbox";
import { Button } from "@nextui-org/button";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/dropdown";

interface Set {
  weight: number | "" | null;
  duration?: number | "" | null;
  reps?: number | "" | null;
  completed: boolean;
}

interface ExerciseDetail {
  exerciseName: string;
  sets: Set[];
  trackingType: string;
}

interface ExerciseTableProps {
  exerciseDetail: ExerciseDetail;
  index: number;
  handleCompleteSet: (
    exerciseIndex: number,
    setIndex: number,
    exerciseName: string,
    isSelected: boolean,
  ) => void;
  handleWeightChange: (
    exerciseIndex: number,
    setIndex: number,
    newValue: number,
  ) => void;
  handleRepChange: (
    exerciseIndex: number,
    setIndex: number,
    newValue: number | null,
  ) => void;
  handleDurationChange: (
    exerciseIndex: number,
    setIndex: number,
    newValue: number | null,
  ) => void;
  handleStartRestTimer: (
    exerciseIndex: number,
    setIndex: number,
    exerciseName: string,
    duration: number,
  ) => void;
  handleStopRestTimer: (
    exerciseIndex: number,
    setIndex: number,
  ) => void;
  activeRestTimer?: {
    exerciseIndex: number;
    setIndex: number;
    timeRemaining: number;
    isActive: boolean;
  } | null;
}

export default function ExerciseTable({
  exerciseDetail,
  index,
  handleCompleteSet,
  handleWeightChange,
  handleRepChange,
  handleDurationChange,
  handleStartRestTimer,
  handleStopRestTimer,
  activeRestTimer,
}: ExerciseTableProps) {
  return (
    <Table
      removeWrapper
      aria-label={`Table for exercise ${exerciseDetail.exerciseName}`}
      className="min-w-full table-auto"
      shadow="none"
    >
      <TableHeader>
        <TableColumn className="w-12">SET</TableColumn>
        <TableColumn className="w-24">KG</TableColumn>
        {exerciseDetail.trackingType === "duration" ? (
          <TableColumn className="w-24">DURATION</TableColumn>
        ) : (
          <TableColumn className="w-24">REPS</TableColumn>
        )}
        <TableColumn className="w-16 text-center">
          <IconSquareCheck />
        </TableColumn>
        <TableColumn className="w-20 text-center">
          <IconClock />
        </TableColumn>
      </TableHeader>
      <TableBody>
        {exerciseDetail.sets.map((set, setIndex) => (
          <TableRow key={setIndex}>
            <TableCell className="w-12">{setIndex + 1}</TableCell>
            <TableCell className="w-24">
              <Input
                size="sm"
                type="number"
                label="Weight"
                placeholder="0"
                defaultValue={set.weight !== null ? String(set.weight) : ""}
                endContent={<span className="text-zinc-600 dark:text-zinc-400">kg</span>}
                onInput={(e) => {
                  const value = e.currentTarget.value;
                  if (!/^(\d*\.?\d{0,2}|\.\d{0,2})$/.test(value)) {
                    e.currentTarget.value = value.slice(0, -1);
                  }
                }}
                onChange={(e) =>
                  handleWeightChange(index, setIndex, Number(e.target.value))
                }
                isDisabled={set.completed}
              />
            </TableCell>
            {exerciseDetail.trackingType === "duration" ? (
              <TableCell className="w-24">
                <Input
                  size="sm"
                  type="number"
                  label="Duration"
                  defaultValue={
                    set.duration !== null ? String(set.duration) : ""
                  }
                  placeholder="0"
                  endContent={<span className="text-zinc-600 dark:text-zinc-400">s</span>}
                  onInput={(e) => {
                    const value = e.currentTarget.value;
                    if (!/^\d*$/.test(value)) {
                      e.currentTarget.value = value.slice(0, -1);
                    }
                  }}
                  onChange={(e) =>
                    handleDurationChange(
                      index,
                      setIndex,
                      Number(e.currentTarget.value),
                    )
                  }
                  isDisabled={set.completed}
                />
              </TableCell>
            ) : (
              <TableCell className="w-24">
                <Input
                  size="sm"
                  label="Reps"
                  type="number"
                  placeholder="0"
                  defaultValue={set.reps !== null ? String(set.reps) : ""}
                  onInput={(e) => {
                    const value = e.currentTarget.value;
                    if (!/^\d*$/.test(value)) {
                      e.currentTarget.value = value.slice(0, -1);
                    }
                  }}
                  onChange={(e) =>
                    handleRepChange(
                      index,
                      setIndex,
                      Number(e.currentTarget.value),
                    )
                  }
                  isDisabled={set.completed}
                />
              </TableCell>
            )}

            <TableCell className="w-16 text-center">
              <Checkbox
                size="lg"
                color={set.completed ? "primary" : "danger"}
                isSelected={set.completed}
                aria-label="Complete Set"
                onValueChange={(isSelected) =>
                  handleCompleteSet(
                    index,
                    setIndex,
                    exerciseDetail.exerciseName,
                    isSelected,
                  )
                }
              />
            </TableCell>

            <TableCell className="w-20 text-center">
              {activeRestTimer &&
               activeRestTimer.exerciseIndex === index &&
               activeRestTimer.setIndex === setIndex ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="text-xs font-mono text-primary">
                    {Math.floor(activeRestTimer.timeRemaining / 60)}:
                    {String(activeRestTimer.timeRemaining % 60).padStart(2, '0')}
                  </div>
                  <Button
                    size="sm"
                    color="danger"
                    variant="flat"
                    isIconOnly
                    onPress={() => handleStopRestTimer(index, setIndex)}
                    aria-label="Stop Rest Timer"
                  >
                    <IconPlayerStop size={16} />
                  </Button>
                </div>
              ) : (
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      isIconOnly
                      isDisabled={!set.completed}
                      aria-label="Start Rest Timer"
                    >
                      <IconClock size={16} />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Rest Timer Duration"
                    onAction={(key) => {
                      const duration = parseInt(key as string);
                      handleStartRestTimer(index, setIndex, exerciseDetail.exerciseName, duration);
                    }}
                  >
                    <DropdownItem key="45">45 seconds</DropdownItem>
                    <DropdownItem key="60">1 minute</DropdownItem>
                    <DropdownItem key="90">1.5 minutes</DropdownItem>
                    <DropdownItem key="120">2 minutes</DropdownItem>
                    <DropdownItem key="180">3 minutes</DropdownItem>
                    <DropdownItem key="300">5 minutes</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
