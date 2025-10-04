"use client";

import { useState } from "react";
import { Button } from "@nextui-org/button";
import { useDisclosure } from "@nextui-org/modal";
import { Textarea, Input } from "@nextui-org/input";
import { IconPlus, IconPhoto, IconX, IconWorldStar } from "@tabler/icons-react";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import BottomSheet from "@/components/UI/BottomSheet";
import { CommunityFeed } from "@/app/(protected)/ninety-day-challenge/_components/CommunityFeed";

interface ChallengeCommunityProps {
  challengeId: string;
  challengeTitle: string;
}

interface NewPostFormData {
  date: string;
  dayDescription: string;
  photos: File[];
}

export function ChallengeCommunity({ challengeId, challengeTitle }: ChallengeCommunityProps) {
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
      <Card shadow="none" className="bg-gradient-to-br from-background to-default-50 border border-divider shadow-xl">
        <CardHeader className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl shadow-lg">
              <IconWorldStar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Community Posts
              </h2>
              <p className="text-sm text-foreground-500">
                {challengeTitle} participant discussions and updates
              </p>
            </div>
          </div>
          <Button
            color="primary"
            startContent={<IconPlus size={18} />}
            className="font-medium"
            onPress={onOpen}
          >
            New Post
          </Button>
        </CardHeader>
        <CardBody className="pt-0">
          {/* Welcome Message */}
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-800 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-2M3 4h12v8H7l-4 4V4z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                  Challenge Community
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Share your progress, motivate fellow participants, and celebrate achievements together!
                </p>
              </div>
            </div>
          </div>

          {/* Community Feed */}
          <CommunityFeed challengeId={challengeId} />
        </CardBody>
      </Card>

      {/* Create Post Modal */}
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Create New Post"
        subtitle={`Share an update with ${challengeTitle} participants`}
        size="2xl"
        footer={
          <>
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
          </>
        }
      >
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
      </BottomSheet>
    </>
  );
}