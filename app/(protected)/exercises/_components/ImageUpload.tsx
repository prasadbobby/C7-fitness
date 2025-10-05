"use client";
import React, { useState, useRef } from "react";
import { Button } from "@nextui-org/button";
import { IconUpload, IconX, IconPhoto } from "@tabler/icons-react";
import { toast } from "sonner";
import Image from "next/image";

interface ImageUploadProps {
  exerciseName: string;
  onImagesUploaded: (imagePaths: string[]) => void;
  disabled?: boolean;
}

interface UploadedImage {
  file: File;
  preview: string;
  index: number;
}

export default function ImageUpload({ exerciseName, onImagesUploaded, disabled = false }: ImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    // Filter for image files only
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length !== files.length) {
      toast.warning("Only image files are allowed. Non-image files were filtered out.");
    }

    // Create preview URLs
    const newImages: UploadedImage[] = imageFiles.map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      index: images.length + index,
    }));

    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const updated = prev.filter(img => img.index !== index);
      // Revoke the URL to prevent memory leaks
      const imageToRemove = prev.find(img => img.index === index);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return updated;
    });
  };

  const uploadImages = async () => {
    if (!exerciseName.trim()) {
      toast.error("Please enter an exercise name first");
      return;
    }

    if (images.length === 0) {
      toast.error("Please select at least one image");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("exerciseName", exerciseName.trim());

      // Add images to form data
      images.forEach((img) => {
        formData.append("images", img.file);
      });

      const response = await fetch("/api/exercises/upload-images", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`${result.totalUploaded} images uploaded successfully!`);

        // Extract the image paths
        const imagePaths = result.uploadedImages.map((img: any) => img.path);
        onImagesUploaded(imagePaths);

        // Clear the uploaded images
        images.forEach(img => URL.revokeObjectURL(img.preview));
        setImages([]);

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to upload images");
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Exercise Images</h3>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
        <div className="text-center">
          <IconPhoto size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Upload exercise demonstration images. They will be automatically named as 0.jpg, 1.jpg, etc.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />

          <Button
            variant="flat"
            color="primary"
            startContent={<IconUpload size={20} />}
            onPress={() => fileInputRef.current?.click()}
            isDisabled={disabled}
          >
            Select Images
          </Button>
        </div>
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Selected Images ({images.length})</h4>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="flat"
                color="danger"
                onPress={clearAll}
                isDisabled={uploading || disabled}
              >
                Clear All
              </Button>
              <Button
                size="sm"
                color="primary"
                startContent={<IconUpload size={16} />}
                onPress={uploadImages}
                isLoading={uploading}
                isDisabled={disabled}
              >
                Upload Images
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.index} className="relative group">
                <div className="aspect-square relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  <Image
                    src={image.preview}
                    alt={`Exercise image ${image.index}`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      color="danger"
                      variant="solid"
                      onPress={() => removeImage(image.index)}
                      isIconOnly
                    >
                      <IconX size={16} />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-center mt-1 text-gray-500">
                  {image.index}.jpg
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      {exerciseName && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Images will be saved to:</strong> <code>/images/exercises/{exerciseName.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_{2,}/g, '_')}/images/</code>
          </p>
        </div>
      )}
    </div>
  );
}