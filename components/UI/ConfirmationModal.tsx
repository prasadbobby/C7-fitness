"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure
} from "@nextui-org/react";
import { IconAlertTriangle, IconTrash, IconX } from "@tabler/icons-react";
import { ReactNode } from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  isLoading?: boolean;
  icon?: ReactNode;
  destructive?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "primary",
  isLoading = false,
  icon,
  destructive = false,
}: ConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  // Auto-set destructive styling for delete operations
  const finalConfirmColor = destructive ? "danger" : confirmColor;
  const finalConfirmText = destructive && confirmText === "Confirm" ? "Delete" : confirmText;
  const finalIcon = icon || (destructive ? <IconTrash size={24} /> : <IconAlertTriangle size={24} />);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      placement="center"
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-sm",
        base: "border border-divider",
        header: "border-b border-divider",
        footer: "border-t border-divider",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            destructive
              ? "bg-danger/10 text-danger"
              : "bg-warning/10 text-warning"
          }`}>
            {finalIcon}
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </ModalHeader>

        <ModalBody className="py-6">
          <div className="text-foreground-600">
            {typeof message === "string" ? (
              <p className="leading-relaxed">{message}</p>
            ) : (
              message
            )}
          </div>
        </ModalBody>

        <ModalFooter className="gap-3">
          <Button
            variant="flat"
            onPress={onClose}
            isDisabled={isLoading}
            startContent={<IconX size={16} />}
          >
            {cancelText}
          </Button>
          <Button
            color={finalConfirmColor}
            onPress={handleConfirm}
            isLoading={isLoading}
            startContent={!isLoading ? (destructive ? <IconTrash size={16} /> : undefined) : undefined}
            className="font-semibold"
          >
            {finalConfirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// Hook for easier usage
export function useConfirmationModal() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return {
    isOpen,
    onOpen,
    onClose,
    ConfirmationModal,
  };
}

// Specialized delete confirmation modal
interface DeleteConfirmationModalProps extends Omit<ConfirmationModalProps, 'destructive' | 'confirmColor' | 'confirmText' | 'title'> {
  title?: string;
  itemName?: string;
  itemType?: string;
}

export function DeleteConfirmationModal({
  title,
  itemName,
  itemType = "item",
  message,
  ...props
}: DeleteConfirmationModalProps) {
  const finalTitle = title || `Delete ${itemType}`;
  const finalMessage = message || (
    <div className="space-y-3">
      <p>
        Are you sure you want to delete <strong>{itemName || `this ${itemType}`}</strong>?
      </p>
      <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg">
        <p className="text-sm text-danger font-medium">
          ⚠️ This action cannot be undone
        </p>
      </div>
    </div>
  );

  return (
    <ConfirmationModal
      {...props}
      title={finalTitle}
      message={finalMessage}
      destructive={true}
    />
  );
}