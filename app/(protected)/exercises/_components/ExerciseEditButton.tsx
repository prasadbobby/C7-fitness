"use client";
import { Button } from "@nextui-org/button";
import { IconEdit } from "@tabler/icons-react";
import { Exercise } from "@prisma/client";
import { useState } from "react";
import EditExerciseModal from "./Modals/EditExerciseModal";

interface ExerciseEditButtonProps {
  exercise: Exercise;
  onExerciseUpdated?: () => void;
}

export default function ExerciseEditButton({ exercise, onExerciseUpdated }: ExerciseEditButtonProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleExerciseUpdated = () => {
    if (onExerciseUpdated) {
      onExerciseUpdated();
    }
    // Reload the page to refresh the exercises list
    window.location.reload();
  };

  return (
    <>
      <Button
        isIconOnly
        onPress={() => setIsEditModalOpen(true)}
        aria-label="Edit exercise"
      >
        <IconEdit className="hover:text-primary" size={20} />
      </Button>

      <EditExerciseModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onExerciseUpdated={handleExerciseUpdated}
        exercise={exercise}
      />
    </>
  );
}