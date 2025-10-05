"use client";
import React, { useState } from "react";
import { Button } from "@nextui-org/button";
import { IconPlus } from "@tabler/icons-react";
import AddExerciseModal from "./Modals/AddExerciseModal";

export default function AdminExerciseControls() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleExerciseAdded = () => {
    // Refresh the page to show the new exercise
    window.location.reload();
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Admin Controls</h2>
          <p className="text-sm text-foreground-500">
            Manage exercises and add new ones to the database
          </p>
        </div>
        <Button
          color="primary"
          startContent={<IconPlus size={20} />}
          onPress={() => setIsAddModalOpen(true)}
          className="min-h-12 px-4"
          size="lg"
        >
          New Exercise
        </Button>
      </div>

      <AddExerciseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onExerciseAdded={handleExerciseAdded}
      />
    </>
  );
}