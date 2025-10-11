"use client";
import { useState, useRef, useEffect } from "react";
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

// Custom RestTimerDropdown component
function RestTimerDropdown({
  onSelectDuration,
  isDisabled
}: {
  onSelectDuration: (duration: number) => void;
  isDisabled: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);

  const durations = [
    { key: 45, label: "45 seconds" },
    { key: 60, label: "1 minute" },
    { key: 90, label: "1.5 minutes" },
    { key: 120, label: "2 minutes" },
    { key: 180, label: "3 minutes" },
    { key: 300, label: "5 minutes" },
  ];

  const handleDurationSelect = (duration: number) => {
    onSelectDuration(duration);
    setIsOpen(false);
  };

  const updatePosition = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right + window.scrollX - 160
      });
    }
  };

  // Update position when dropdown opens
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);
    }

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        size="sm"
        color="primary"
        variant="flat"
        isIconOnly
        isDisabled={isDisabled}
        aria-label="Start Rest Timer"
        onPress={() => setIsOpen(!isOpen)}
      >
        <IconClock size={16} />
      </Button>

      {isOpen && !isDisabled && (
        <div className="fixed z-[99999] min-w-[160px] bg-content1 shadow-large rounded-large border border-divider backdrop-blur-md backdrop-saturate-150 py-1"
             style={{
               top: `${position.top}px`,
               left: `${position.left}px`
             }}>
          {durations.map((duration) => (
            <button
              key={duration.key}
              className="relative flex w-full cursor-pointer select-none items-center rounded-small px-2 py-1.5 text-small subpixel-antialiased outline-none transition-colors hover:bg-default-100 active:bg-default-200 data-[hover=true]:bg-default-100 data-[selectable=true]:focus:bg-default-100 data-[pressed=true]:opacity-70 data-[focus-visible=true]:z-10 data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-focus data-[focus-visible=true]:outline-offset-2 text-foreground tap-highlight-transparent"
              onClick={() => handleDurationSelect(duration.key)}
            >
              {duration.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
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
                <RestTimerDropdown
                  onSelectDuration={(duration) =>
                    handleStartRestTimer(index, setIndex, exerciseDetail.exerciseName, duration)
                  }
                  isDisabled={!set.completed}
                />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
