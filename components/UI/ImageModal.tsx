"use client";

import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalBody } from "@nextui-org/modal";
import { Button } from "@nextui-org/button";
import { IconX, IconChevronLeft, IconChevronRight, IconDownload } from "@tabler/icons-react";

interface ImageModalProps {
  images: string[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

export function ImageModal({ images, isOpen, onClose, initialIndex = 0 }: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = images[currentIndex];
    link.download = `progress-photo-${currentIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isOpen) return;

    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        handlePrevious();
        break;
      case "ArrowRight":
        event.preventDefault();
        handleNext();
        break;
      case "Escape":
        event.preventDefault();
        onClose();
        break;
    }
  };

  // Add keyboard event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown as any);
      return () => document.removeEventListener("keydown", handleKeyDown as any);
    }
  }, [isOpen, currentIndex]);

  if (images.length === 0) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="5xl"
      classNames={{
        base: "bg-black/90",
        backdrop: "bg-black/80",
        wrapper: "items-center justify-center",
      }}
      hideCloseButton
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: {
              duration: 0.3,
              ease: "easeOut",
            },
          },
          exit: {
            y: -20,
            opacity: 0,
            scale: 0.95,
            transition: {
              duration: 0.2,
              ease: "easeIn",
            },
          },
        }
      }}
    >
      <ModalContent className="bg-transparent shadow-none max-w-none max-h-none">
        <ModalBody className="p-0 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <Button
              isIconOnly
              variant="flat"
              className="absolute top-4 right-4 z-10 bg-black/50 text-white hover:bg-black/70"
              onPress={onClose}
            >
              <IconX size={20} />
            </Button>

            {/* Download Button */}
            <Button
              isIconOnly
              variant="flat"
              className="absolute top-4 right-16 z-10 bg-black/50 text-white hover:bg-black/70"
              onPress={handleDownload}
            >
              <IconDownload size={20} />
            </Button>

            {/* Navigation Buttons - Only show if multiple images */}
            {images.length > 1 && (
              <>
                <Button
                  isIconOnly
                  variant="flat"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70"
                  onPress={handlePrevious}
                >
                  <IconChevronLeft size={24} />
                </Button>

                <Button
                  isIconOnly
                  variant="flat"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70"
                  onPress={handleNext}
                >
                  <IconChevronRight size={24} />
                </Button>
              </>
            )}

            {/* Main Image */}
            <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center">
              <img
                src={images[currentIndex]}
                alt={`Progress photo ${currentIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                style={{ maxHeight: "90vh", maxWidth: "90vw" }}
              />
            </div>

            {/* Image Counter - Only show if multiple images */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                  {currentIndex + 1} / {images.length}
                </div>
              </div>
            )}

            {/* Thumbnail Navigation - Only show if multiple images */}
            {images.length > 1 && images.length <= 10 && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10">
                <div className="flex gap-2 bg-black/50 p-2 rounded-lg">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                        index === currentIndex
                          ? "border-white shadow-lg scale-110"
                          : "border-gray-400 hover:border-white opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}