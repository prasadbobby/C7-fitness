"use client";
import { handleDeleteUserGoal } from "@/server-actions/UserServerActions";
import { IconX } from "@tabler/icons-react";
import { useTransition } from "react";
import { DeleteConfirmationModal } from "@/components/UI/ConfirmationModal";
import { useDisclosure } from "@nextui-org/react";

export default function DeleteDashboardGoal({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  const openDeleteModal = () => {
    onDeleteOpen();
  };

  const handleDelete = () => {
    startTransition(() => {
      handleDeleteUserGoal(id);
    });
    onDeleteClose();
  };

  return (
    <>
      <button onClick={openDeleteModal} disabled={isPending} aria-label="Delete goal">
        <IconX className="text-zinc-500" />
      </button>

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={handleDelete}
        itemName="this goal"
        itemType="goal"
        isLoading={isPending}
        message=""
      />
    </>
  );
}
