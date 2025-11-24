"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { handleDeleteRoutine } from "@/server-actions/RoutineServerActions";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@/components/UI/CustomDropdown";
import { useDisclosure } from "@nextui-org/react";
import CustomButton from "@/components/UI/CustomButton";
import {
  IconEdit,
  IconEye,
  IconDots,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";
import BottomSheet from "@/components/UI/BottomSheet";
import WorkoutPreview from "./WorkoutPreview";

type RoutineMenuProps = {
  routineId: string;
  userRole?: string;
  isSystemWorkout?: boolean;
};

export default function RoutineMenu({ routineId, userRole, isSystemWorkout = false }: RoutineMenuProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();

  // Determine what actions to show based on user role
  const isAdmin = userRole === "ADMIN";
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  // Super admins can edit/delete all workouts (both system and personal)
  // Admins can only preview
  const canEdit = isSuperAdmin;
  const canDelete = isSuperAdmin;

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
    } else if (key === "preview") {
      onPreviewOpen();
    }
  };

  return (
    <div className="relative">
      <Dropdown
        className="z-[999999]"
      >
        <DropdownTrigger>
          <button
            className="flex items-center justify-center h-8 w-8 min-w-8 rounded-md text-default-500 hover:text-default-700 hover:bg-default-100 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <IconDots size={16} />
          </button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Workout actions"
          onAction={(key) => {
            handleAction(String(key), routineId);
          }}
        >
          <DropdownItem
            startContent={<IconEye size={16} />}
            className="text-sm"
            key="preview"
          >
            Preview
          </DropdownItem>
          {canEdit && (
            <DropdownItem
              startContent={<IconEdit size={16} />}
              className="text-sm"
              key="edit"
            >
              Edit
            </DropdownItem>
          )}
          {canDelete && (
            <DropdownItem
              startContent={<IconTrash size={16} />}
              danger={true}
              className="text-sm"
              key="delete"
            >
              Delete
            </DropdownItem>
          )}
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

      {/* Workout Preview Modal */}
      <WorkoutPreview
        isOpen={isPreviewOpen}
        onClose={onPreviewClose}
        workoutId={routineId}
      />
    </div>
  );
}
