"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { handleDeleteRoutine } from "@/server-actions/RoutineServerActions";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
} from "@/components/UI/CustomDropdown";
import { useDisclosure } from "@nextui-org/react";
import CustomButton from "@/components/UI/CustomButton";
import {
  IconEdit,
  IconInfoCircle,
  IconMenu2,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";
import BottomSheet from "@/components/UI/BottomSheet";

export default function RoutineMenu({ routineId }: { routineId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await handleDeleteRoutine(routineId);
      if (response.success) {
        toast.success(response.message);
        onDeleteClose();
      } else {
        toast.error(response.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (key: string, routineId: string) => {
    if (key === "delete") {
      onDeleteOpen();
    } else if (key === "edit") {
      router.push(`/edit-routine/step-1?id=${routineId}`);
    }
  };

  return (
    <>
      <Dropdown>
        <DropdownTrigger>
          <button className="shrink-0" aria-label="Routine actions">
            <IconMenu2 className="text-black dark:text-primary" size={22} />
          </button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Static Actions"
          topContent={
            <h4 className="text-zinc-500 uppercase font-semibold text-xs px-2 pt-2">
              Routine Actions
            </h4>
          }
          onAction={(key) => handleAction(String(key), routineId)}
        >
          <DropdownSection showDivider>
            <DropdownItem startContent={<IconEdit size={20} />} key="edit">
              Edit
            </DropdownItem>
          </DropdownSection>

          <DropdownItem
            startContent={<IconTrash size={20} />}
            key="delete"
            className="text-danger"
            color="danger"
          >
            Delete Routine
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      {/* Delete Confirmation Modal */}
      <BottomSheet
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        title="Delete Routine"
        size="md"
        footer={
          <>
            <CustomButton variant="ghost" onPress={onDeleteClose}>
              Cancel
            </CustomButton>
            <CustomButton color="danger" onPress={handleDelete} isLoading={loading}>
              Delete
            </CustomButton>
          </>
        }
      >
        <p>Are you sure you want to delete this routine? This action cannot be undone.</p>
      </BottomSheet>
    </>
  );
}
