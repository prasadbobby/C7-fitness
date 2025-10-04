"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Textarea } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { Slider } from "@nextui-org/slider";
import { Chip } from "@nextui-org/chip";
import { Progress } from "@nextui-org/progress";
import { IconCamera, IconCheck, IconEdit } from "@tabler/icons-react";

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
  photos: string[];
}

export function DailyPostForm() {
  const [hasPostedToday, setHasPostedToday] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [todaysPost, setTodaysPost] = useState<TodaysPost | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [formData, setFormData] = useState({
    sleepHours: 8,
    sleepQuality: "",
    mealTracking: "",
    dayDescription: "",
    mood: "",
    energy: "",
    achievements: "",
    challenges: "",
    photos: [] as string[],
  });

  useEffect(() => {
    checkTodaysPost();
  }, []);

  const checkTodaysPost = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/ninety-day-challenge/posts/today?date=${today}`);
      if (response.ok) {
        const data = await response.json();
        if (data.post) {
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
            photos: data.post.photos || [],
          });
        }
      }
    } catch (error) {
      console.error('Error checking today\'s post:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const method = hasPostedToday ? 'PUT' : 'POST';
      const url = hasPostedToday
        ? `/api/ninety-day-challenge/posts/${todaysPost?.id}`
        : '/api/ninety-day-challenge/posts';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          date: today,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTodaysPost(data.post);
        setHasPostedToday(true);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error submitting post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);

    try {
      console.log('Starting photo upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json();
      console.log('Upload response:', { status: response.status, data });

      if (response.ok) {
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, data.url],
        }));
        console.log('Photo added to form data successfully');
      } else {
        console.error('Upload failed:', data);
        alert(`Failed to upload photo: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }

    // Clear the input
    event.target.value = '';
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
          {hasPostedToday ? "Today's Update" : "Create Today's Post"}
        </h3>
        {hasPostedToday && (
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
      </CardHeader>

      <CardBody>
        {hasPostedToday && !isEditing ? (
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
            </div>

            {formData.mealTracking && (
              <div>
                <span className="font-medium">Meals:</span>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  {formData.mealTracking}
                </p>
              </div>
            )}

            {formData.dayDescription && (
              <div>
                <span className="font-medium">How was your day:</span>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  {formData.dayDescription}
                </p>
              </div>
            )}

            {formData.achievements && (
              <div>
                <span className="font-medium">Achievements:</span>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  {formData.achievements}
                </p>
              </div>
            )}

            {formData.challenges && (
              <div>
                <span className="font-medium">Challenges:</span>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  {formData.challenges}
                </p>
              </div>
            )}

            {formData.photos.length > 0 && (
              <div>
                <span className="font-medium">Photos:</span>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {formData.photos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Progress photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
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
                />
              </div>

              <Select
                placeholder="Sleep Quality"
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
                placeholder="Mood"
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
                placeholder="Energy Level"
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

            {/* Photo Upload */}
            <div className="space-y-4">
              <h4 className="font-medium text-zinc-800 dark:text-zinc-200">Progress Photos</h4>

              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                  disabled={uploadingPhoto}
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
                    {uploadingPhoto ? 'Uploading...' : 'Add Photo'}
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
                    <div key={index} className="relative">
                      <img
                        src={photo}
                        alt={`Progress photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        className="absolute top-2 right-2"
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
    </Card>
  );
}