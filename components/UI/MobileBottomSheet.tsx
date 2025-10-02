"use client";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/react";
import { ReactNode } from "react";

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
  scrollBehavior?: "inside" | "outside";
}

export default function MobileBottomSheet({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "2xl",
  scrollBehavior = "inside",
}: MobileBottomSheetProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      scrollBehavior={scrollBehavior}
      classNames={{
        base: "mx-4 md:mx-auto",
        backdrop: "bg-black/50",
        wrapper: "md:items-center items-end",
        body: "py-6",
        header: "border-b-[1px] border-divider md:border-b-0",
        footer: "border-t-[1px] border-divider md:border-t-0",
      }}
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: {
              duration: 0.3,
              ease: "easeOut",
            },
          },
          exit: {
            y: "100%",
            opacity: 0,
            transition: {
              duration: 0.2,
              ease: "easeIn",
            },
          },
        },
      }}
    >
      <ModalContent className="md:rounded-lg rounded-t-3xl rounded-b-none md:rounded-b-lg md:mb-0 mb-0 md:max-h-[90vh] max-h-[90vh]">
        <ModalHeader className="flex flex-col gap-1">
          {/* iOS drag handle for mobile */}
          <div className="md:hidden flex justify-center py-2">
            <div className="w-12 h-1 bg-default-300 rounded-full"></div>
          </div>
          <span>{title}</span>
        </ModalHeader>
        <ModalBody>{children}</ModalBody>
        {footer && <ModalFooter>{footer}</ModalFooter>}
      </ModalContent>
    </Modal>
  );
}