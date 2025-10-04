"use client";

import { useState } from "react";
import { Button } from "@nextui-org/button";
import { IconPlus } from "@tabler/icons-react";
import { CommunityFeed } from "../../_components/CommunityFeed";
import BottomSheet from "@/components/UI/BottomSheet";
import { Textarea } from "@nextui-org/input";
import { IconCamera, IconX } from "@tabler/icons-react";
import DatePicker from "@/components/UI/DatePicker";

interface PostsClientWrapperProps {
  challengeId: string | null;
  challengeTitle: string;
  isAdmin: boolean;
  showTodayByDefault: boolean;
}

export function PostsClientWrapper({
  challengeId,
  challengeTitle,
  isAdmin,
  showTodayByDefault
}: PostsClientWrapperProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date(), // Use Date object instead of string
    dayDescription: "",
    photos: [] as File[],
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
      date: new Date(), // Reset to today's date
      dayDescription: "",
      photos: [],
    });
  };

  const handleSubmit = async () => {
    if (!challengeId) {
      alert('No challenge selected');
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append('challengeId', challengeId);

      // Convert date to local YYYY-MM-DD format to avoid timezone issues
      const year = formData.date.getFullYear();
      const month = String(formData.date.getMonth() + 1).padStart(2, '0');
      const day = String(formData.date.getDate()).padStart(2, '0');
      const localDateString = `${year}-${month}-${day}`;

      submitData.append('date', localDateString);
      submitData.append('dayDescription', formData.dayDescription);

      // Add photos
      formData.photos.forEach((photo) => {
        submitData.append(`photos`, photo);
      });

      const response = await fetch('/api/ninety-day-challenge/posts', {
        method: 'POST',
        body: submitData,
      });

      if (response.ok) {
        resetForm();
        setIsModalOpen(false);
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
      {/* New Post Button for Admins */}
      {isAdmin && challengeId && (
        <div className="flex justify-end mb-4">
          <Button
            color="primary"
            size="sm"
            startContent={<IconPlus size={16} />}
            onPress={() => setIsModalOpen(true)}
          >
            New Post
          </Button>
        </div>
      )}

      {/* Community Feed */}
      <CommunityFeed challengeId={challengeId} showTodayByDefault={showTodayByDefault} />

      {/* Admin Post Modal */}
      <BottomSheet
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Post"
        subtitle={`Share an update with ${challengeTitle} participants`}
        size="2xl"
        footer={
          <>
            <Button
              variant="light"
              onPress={() => setIsModalOpen(false)}
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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Post Date *
              </label>
              <Button
                size="sm"
                variant="light"
                onPress={() => setFormData(prev => ({ ...prev, date: new Date() }))}
                className="text-xs h-6 px-2"
              >
                Today
              </Button>
            </div>
            <DatePicker
              value={formData.date}
              onChange={(date) => setFormData(prev => ({ ...prev, date: date || new Date() }))}
              placeholder="Select post date"
              className="w-full"
            />
          </div>

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
              <IconCamera size={20} className="text-zinc-500" />
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