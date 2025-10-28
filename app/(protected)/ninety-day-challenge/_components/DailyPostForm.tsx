"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { Textarea } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { Slider } from "@nextui-org/slider";
import { Chip } from "@nextui-org/chip";
import { RadioGroup, Radio } from "@nextui-org/radio";
import { IconCamera, IconCheck, IconEdit } from "@tabler/icons-react";
import { ImageModal } from "@/components/UI/ImageModal";
import { processUploadedFiles } from "@/utils/imageUtils";
import { processImagesForUpload } from "@/utils/imageCompression";
import { toast } from "sonner";

interface TodaysPost {
  id: string;
  sleepHours: number;
  sleepQuality: string;
  mealTracking: string;
  dayDescription: string;
  mood: string;
  energy: string;
  achievements: string;
  challenges: string;
  isFasting: boolean;
  photos: string[];
}

interface DailyPostFormProps {
  challengeId: string;
}

export function DailyPostForm({ challengeId }: DailyPostFormProps) {
  const [hasPostedToday, setHasPostedToday] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [todaysPost, setTodaysPost] = useState<TodaysPost | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [initialImageIndex, setInitialImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    sleepHours: 8,
    sleepQuality: "",
    mealTracking: "",
    dayDescription: "",
    mood: "",
    energy: "",
    achievements: "",
    challenges: "",
    isFasting: false,
    photos: [] as string[],
  });

  useEffect(() => {
    checkUserRole();
    if (challengeId) {
      checkTodaysPost();
    }
  }, [challengeId]);

  // Reset form state when challenge changes
  useEffect(() => {
    setHasPostedToday(false);
    setIsEditing(false);
    setTodaysPost(null);
    setFormData({
      sleepHours: 8,
      sleepQuality: "",
      mealTracking: "",
      dayDescription: "",
      mood: "",
      energy: "",
      achievements: "",
      challenges: "",
      isFasting: false,
      photos: [],
    });
  }, [challengeId]);

  const checkUserRole = async () => {
    try {
      const response = await fetch('/api/user/role');
      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.role === 'ADMIN' || data.role === 'SUPER_ADMIN');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const checkTodaysPost = async () => {
    try {
      // Get local date to avoid timezone issues
      const today = new Date();
      const localDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
      const response = await fetch(`/api/ninety-day-challenge/posts/today?date=${localDate}&challengeId=${challengeId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.post && !isAdmin) {
          // Only set hasPostedToday for non-admin users
          setTodaysPost(data.post);
          setHasPostedToday(true);
          setFormData({
            sleepHours: data.post.sleepHours || 8,
            sleepQuality: data.post.sleepQuality || "",
            mealTracking: data.post.mealTracking || "",
            dayDescription: data.post.dayDescription || "",
            mood: data.post.mood || "",
            energy: data.post.energy || "",
            achievements: data.post.achievements || "",
            challenges: data.post.challenges || "",
            isFasting: data.post.isFasting || false,
            photos: data.post.photos || [],
          });
        }
        // For admins, always allow new posts regardless of existing posts
      }
    } catch (error) {
      console.error('Error checking today\'s post:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get local date to avoid timezone issues
      const today = new Date();
      const localDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
      const method = (hasPostedToday && !isAdmin) ? 'PUT' : 'POST';
      const url = (hasPostedToday && !isAdmin)
        ? `/api/ninety-day-challenge/posts/${todaysPost?.id}`
        : '/api/ninety-day-challenge/posts';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          date: localDate,
          challengeId: challengeId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (isAdmin) {
          // For admins, reset the form after successful post creation
          setFormData({
            sleepHours: 8,
            sleepQuality: "",
            mealTracking: "",
            dayDescription: "",
            mood: "",
            energy: "",
            achievements: "",
            challenges: "",
            isFasting: false,
            photos: [],
          });
          alert('Post created successfully! You can create another post.');
        } else {
          setTodaysPost(data.post);
          setHasPostedToday(true);
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error('Error submitting post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhoto(true);

    try {
      const filesArray = Array.from(files);
      console.log('Starting photo upload:', {
        fileCount: filesArray.length,
        files: filesArray.map(f => ({ name: f.name, size: f.size, type: f.type }))
      });

      toast.info('Processing images for upload...', { duration: 3000 });

      // First convert HEIC to JPEG if necessary
      const convertedFiles = await processUploadedFiles(filesArray);

      // Then compress all images to ensure they upload successfully
      const compressedFiles = await processImagesForUpload(convertedFiles);

      const uploadedUrls: string[] = [];

      // Upload each processed and compressed file
      for (const file of compressedFiles) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        const data = await response.json();
        console.log('Upload response:', { fileName: file.name, status: response.status, data });

        if (response.ok) {
          uploadedUrls.push(data.url);
        } else {
          console.error('Upload failed for', file.name, ':', data);
          toast.error(`Failed to upload ${file.name}: ${data.error || 'Unknown error'}`);
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, ...uploadedUrls],
        }));
        toast.success(`${uploadedUrls.length} photo(s) uploaded successfully!`);
        console.log(`${uploadedUrls.length} photos added to form data successfully`);
      }
    } catch (error) {
      console.error('Error processing/uploading files:', error);
      toast.error('Error processing photos. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }

    // Clear the input
    event.target.value = '';
  };

  const handleImageClick = (images: string[], clickedIndex: number) => {
    setSelectedImages(images);
    setInitialImageIndex(clickedIndex);
    setIsImageModalOpen(true);
  };

  const sleepQualityOptions = [
    { key: "POOR", label: "Poor" },
    { key: "FAIR", label: "Fair" },
    { key: "GOOD", label: "Good" },
    { key: "VERY_GOOD", label: "Very Good" },
    { key: "EXCELLENT", label: "Excellent" },
  ];

  const moodOptions = [
    { key: "VERY_LOW", label: "Very Low" },
    { key: "LOW", label: "Low" },
    { key: "NEUTRAL", label: "Neutral" },
    { key: "GOOD", label: "Good" },
    { key: "VERY_GOOD", label: "Very Good" },
    { key: "EXCELLENT", label: "Excellent" },
  ];

  const energyOptions = [
    { key: "VERY_LOW", label: "Very Low" },
    { key: "LOW", label: "Low" },
    { key: "MODERATE", label: "Moderate" },
    { key: "HIGH", label: "High" },
    { key: "VERY_HIGH", label: "Very High" },
  ];

  return (
    <Card>
      <CardHeader className="flex justify-between">
        <h3 className="text-lg font-semibold">
          {isAdmin ? "Create New Post" : (hasPostedToday ? "Today's Update" : "Create Today's Post")}
        </h3>
        {hasPostedToday && !isAdmin && (
          <div className="flex gap-2">
            <Chip color="success" size="sm" startContent={<IconCheck size={16} />}>
              Posted
            </Chip>
            {!isEditing && (
              <Button
                size="sm"
                variant="flat"
                startContent={<IconEdit size={16} />}
                onPress={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
          </div>
        )}
        {isAdmin && (
          <Chip color="primary" size="sm">
            Admin Mode
          </Chip>
        )}
      </CardHeader>

      <CardBody>
        {hasPostedToday && !isEditing && !isAdmin ? (
          // Display Mode
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Sleep:</span> {formData.sleepHours}h
              </div>
              <div>
                <span className="font-medium">Quality:</span> {formData.sleepQuality}
              </div>
              <div>
                <span className="font-medium">Mood:</span> {formData.mood}
              </div>
              <div>
                <span className="font-medium">Energy:</span> {formData.energy}
              </div>
              {formData.isFasting && (
                <div className="col-span-2">
                  <span className="font-medium text-green-600">Today Fasting:</span> Yes
                </div>
              )}
            </div>

            {formData.mealTracking && (
              <div>
                <span className="font-medium">Meals:</span>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 whitespace-pre-wrap">
                  {formData.mealTracking}
                </p>
              </div>
            )}

            {formData.dayDescription && (
              <div>
                <span className="font-medium">How was your day:</span>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 whitespace-pre-wrap">
                  {formData.dayDescription}
                </p>
              </div>
            )}

            {formData.achievements && (
              <div>
                <span className="font-medium">Achievements:</span>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 whitespace-pre-wrap">
                  {formData.achievements}
                </p>
              </div>
            )}

            {formData.challenges && (
              <div>
                <span className="font-medium">Challenges:</span>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 whitespace-pre-wrap">
                  {formData.challenges}
                </p>
              </div>
            )}

            {formData.photos.length > 0 && (
              <div>
                <span className="font-medium">Photos:</span>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {formData.photos.map((photo, index) => (
                    <div
                      key={index}
                      className="relative group cursor-pointer overflow-hidden rounded-lg"
                      onClick={() => handleImageClick(formData.photos, index)}
                    >
                      <img
                        src={photo}
                        alt={`Progress photo ${index + 1}`}
                        className="w-full h-32 object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 rounded-full p-2">
                          <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Form Mode
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sleep Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-zinc-800 dark:text-zinc-200">Sleep Tracking</h4>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sleep Hours: {formData.sleepHours}h</label>
                <Slider
                  size="sm"
                  step={0.5}
                  minValue={0}
                  maxValue={12}
                  value={formData.sleepHours}
                  onChange={(value) => setFormData({ ...formData, sleepHours: value as number })}
                  className="w-full"
                  aria-label={`Sleep hours: ${formData.sleepHours} hours`}
                />
              </div>

              <Select
                label="Sleep Quality"
                placeholder="Select sleep quality"
                selectedKeys={formData.sleepQuality ? [formData.sleepQuality] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setFormData({ ...formData, sleepQuality: selected });
                }}
                isRequired
              >
                {sleepQualityOptions.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Meals Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-zinc-800 dark:text-zinc-200">Meal Tracking</h4>
              <Textarea
                placeholder="Describe your meals today..."
                value={formData.mealTracking}
                onChange={(e) => setFormData({ ...formData, mealTracking: e.target.value })}
                rows={3}
              />
            </div>

            {/* Mood & Energy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Mood"
                placeholder="Select your mood"
                selectedKeys={formData.mood ? [formData.mood] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setFormData({ ...formData, mood: selected });
                }}
                isRequired
              >
                {moodOptions.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>

              <Select
                label="Energy Level"
                placeholder="Select your energy level"
                selectedKeys={formData.energy ? [formData.energy] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setFormData({ ...formData, energy: selected });
                }}
                isRequired
              >
                {energyOptions.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Day Description */}
            <Textarea
              label="How was your day?"
              placeholder="Tell us about your day..."
              value={formData.dayDescription}
              onChange={(e) => setFormData({ ...formData, dayDescription: e.target.value })}
              rows={3}
            />

            {/* Achievements & Challenges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Textarea
                label="Today's Achievements"
                placeholder="What did you accomplish?"
                value={formData.achievements}
                onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                rows={2}
              />

              <Textarea
                label="Challenges Faced"
                placeholder="What was difficult today?"
                value={formData.challenges}
                onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                rows={2}
              />
            </div>

            {/* Fasting Option */}
            <div className="space-y-4">
              <h4 className="font-medium text-zinc-800 dark:text-zinc-200">Today Fasting</h4>
              <RadioGroup
                value={formData.isFasting ? "yes" : "no"}
                onValueChange={(value) => setFormData({ ...formData, isFasting: value === "yes" })}
                orientation="horizontal"
              >
                <Radio value="no">No</Radio>
                <Radio value="yes">Yes</Radio>
              </RadioGroup>
              {/* <p className="text-sm text-zinc-600 dark:text-zinc-400">
                If you're fasting today, you'll receive full photo points regardless of uploaded photos.
              </p> */}
            </div>

            {/* Photo Upload */}
            <div className="space-y-4">
              <h4 className="font-medium text-zinc-800 dark:text-zinc-200">Progress Photos</h4>

              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*,.heic,.HEIC"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                  disabled={uploadingPhoto}
                  aria-label="Upload progress photos"
                />
                <label
                  htmlFor="photo-upload"
                  className={`flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg transition-colors ${
                    uploadingPhoto
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  <IconCamera size={20} />
                  <span className="text-sm">
                    {uploadingPhoto ? 'Uploading...' : 'Add Photos'}
                  </span>
                </label>
                {uploadingPhoto && (
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing image...</span>
                  </div>
                )}
              </div>

              {formData.photos.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <div
                        className="cursor-pointer overflow-hidden rounded-lg"
                        onClick={() => handleImageClick(formData.photos, index)}
                      >
                        <img
                          src={photo}
                          alt={`Progress photo ${index + 1}`}
                          className="w-full h-32 object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 rounded-full p-2">
                            <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        className="absolute top-2 right-2 z-10"
                        onPress={() => {
                          const newPhotos = formData.photos.filter((_, i) => i !== index);
                          setFormData({ ...formData, photos: newPhotos });
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-2">
              <Button
                type="submit"
                color="primary"
                isLoading={loading}
                className="flex-1"
              >
                {hasPostedToday ? 'Update Post' : 'Submit Post'}
              </Button>
              {isEditing && (
                <Button
                  variant="flat"
                  onPress={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        )}
      </CardBody>

      {/* Image Modal */}
      <ImageModal
        images={selectedImages}
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        initialIndex={initialImageIndex}
      />
    </Card>
  );
}