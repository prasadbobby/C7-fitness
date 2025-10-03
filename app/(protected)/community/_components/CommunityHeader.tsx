"use client";

import { useState } from "react";
import { Button } from "@nextui-org/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@nextui-org/modal";
import { Textarea, Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { IconPlus, IconPhoto, IconX } from "@tabler/icons-react";
import { Card, CardBody } from "@nextui-org/card";
import PageHeading from "@/components/PageHeading/PageHeading";
import Link from "next/link";

interface CommunityHeaderProps {
  isAdmin?: boolean;
  challengeId?: string | null;
}

interface NewPostFormData {
  date: string;
  dayDescription: string;
  photos: File[];
}

// Removed options - not needed for simplified admin form

export function CommunityHeader({ isAdmin, challengeId }: CommunityHeaderProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<NewPostFormData>({
    date: new Date().toISOString().split('T')[0],
    dayDescription: "",
    photos: [],
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setFormData(prev => ({ ...prev, photos: [...prev.photos, ...files] }));
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      dayDescription: "",
      photos: [],
    });
  };

  const handleSubmit = async () => {
    if (!challengeId) {
      alert("No active challenge found");
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append('challengeId', challengeId);
      submitData.append('date', formData.date);
      submitData.append('dayDescription', formData.dayDescription);

      // Add photos
      formData.photos.forEach((photo, index) => {
        submitData.append(`photos`, photo);
      });

      const response = await fetch('/api/ninety-day-challenge/posts', {
        method: 'POST',
        body: submitData,
      });

      if (response.ok) {
        resetForm();
        onClose();
        // Refresh the page to show new post
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Error creating post: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error creating post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <PageHeading
          title="Community Discussion"
          subtitle="Connect with fellow participants, share your journey, and motivate each other"
        />
        {isAdmin ? (
          <Button
            color="primary"
            startContent={<IconPlus size={18} />}
            className="font-medium"
            onPress={onOpen}
          >
            New Post
          </Button>
        ) : (
          <Link href="/ninety-day-challenge">
            <Button
              color="primary"
              startContent={<IconPlus size={18} />}
              className="font-medium"
            >
              New Post
            </Button>
          </Link>
        )}
      </div>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        classNames={{
          base: "max-h-[90vh]",
          body: "p-6",
          header: "border-b border-zinc-200 dark:border-zinc-700",
        }}
      >
        <ModalContent>
          <ModalHeader>
            <h2 className="text-xl font-bold">Create New Post</h2>
            <p className="text-sm text-zinc-500 font-normal">Share an update with the community</p>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {/* Date */}
              <Input
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                isRequired
                size="sm"
              />

              {/* Post Content */}
              <Textarea
                label="What's happening?"
                placeholder="Share an update, motivation, or announcement with the community..."
                value={formData.dayDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, dayDescription: e.target.value }))}
                minRows={4}
                maxRows={8}
                isRequired
                classNames={{
                  input: "text-base",
                  inputWrapper: "border-2 border-zinc-200 dark:border-zinc-700 hover:border-primary-300 focus-within:border-primary-500"
                }}
              />

              {/* Photo Upload */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <IconPhoto size={20} className="text-zinc-500" />
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Add Photos (Optional)
                  </label>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-zinc-500 dark:text-zinc-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary-50 file:text-primary-700
                    hover:file:bg-primary-100
                    dark:file:bg-primary-900/50 dark:file:text-primary-300"
                />

                {/* Photo Preview */}
                {formData.photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {formData.photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <Button
                          isIconOnly
                          size="sm"
                          color="danger"
                          variant="faded"
                          className="absolute top-1 right-1"
                          onPress={() => removePhoto(index)}
                        >
                          <IconX size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={onClose}
              isDisabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              isLoading={isSubmitting}
              isDisabled={!formData.dayDescription.trim()}
              className="font-medium"
            >
              Post
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}