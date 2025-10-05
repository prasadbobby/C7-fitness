"use client";
import React, { useState } from "react";
import { Button } from "@nextui-org/button";
import { useDisclosure } from "@nextui-org/react";
import { IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import BottomSheet from "@/components/UI/BottomSheet";

interface ExerciseDeleteButtonProps {
  exerciseId: string;
  exerciseName: string;
  onDeleted: () => void;
}

export default function ExerciseDeleteButton({ exerciseId, exerciseName, onDeleted }: ExerciseDeleteButtonProps) {
  const [loading, setLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/exercises?id=${exerciseId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        onDeleted();
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete exercise");
      }
    } catch (error) {
      console.error("Error deleting exercise:", error);
      toast.error("Failed to delete exercise. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="flat"
        color="danger"
        startContent={<IconTrash size={16} />}
        onPress={onOpen}
        aria-label="Delete exercise"
      >
        
      </Button>

      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Delete Exercise"
        size="md"
        footer={
          <>
            <Button variant="ghost" onPress={onClose}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleDelete} isLoading={loading}>
              Delete Exercise
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to delete the exercise <strong>"{exerciseName}"</strong>?
          </p>
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
            <p className="text-sm text-red-700 dark:text-red-300">
              <strong>Warning:</strong> This action cannot be undone. This will permanently delete:
            </p>
            <ul className="text-sm text-red-600 dark:text-red-400 mt-2 ml-4 list-disc">
              <li>The exercise from the database</li>
              <li>All associated images and files</li>
              <li>The exercise directory structure</li>
            </ul>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}