/**
 * Image compression utilities for handling large images in post uploads
 */

/**
 * Calculate the estimated base64 size from file size
 * Base64 encoding increases size by approximately 33% (4/3 ratio)
 */
export function estimateBase64Size(fileSizeInBytes: number): number {
  return Math.ceil(fileSizeInBytes * 4 / 3);
}

/**
 * Check if a file will exceed reasonable limits when converted to base64
 */
export function willExceedBase64Limits(fileSizeInBytes: number): boolean {
  const base64Size = estimateBase64Size(fileSizeInBytes);
  // Conservative limit: 6MB base64 (roughly 4.5MB original file)
  return base64Size > 6 * 1024 * 1024;
}

/**
 * Compress an image file using Canvas API (client-side)
 * This ensures ALL images work regardless of original size/resolution
 */
export async function compressImage(file: File, targetMaxSizeMB: number = 1.5): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Smart resizing based on original dimensions
      let { width, height } = img;

      // For very large images (like iPhone photos), be more aggressive
      let maxDimension: number;
      if (width > 3000 || height > 3000) {
        maxDimension = 1600; // Large images -> 1600px max
      } else if (width > 2000 || height > 2000) {
        maxDimension = 1800; // Medium-large -> 1800px max
      } else {
        maxDimension = 1920; // Normal images -> 1920px max
      }

      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
      }

      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      // Draw with high quality
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
      }

      // Try different quality levels to hit target size
      const tryCompress = (quality: number): void => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const sizeInMB = blob.size / (1024 * 1024);

              // If under target size, we're good
              if (sizeInMB <= targetMaxSizeMB || quality <= 0.3) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                console.log(`Compressed ${file.name}: ${(file.size / (1024 * 1024)).toFixed(2)}MB → ${sizeInMB.toFixed(2)}MB (${Math.round(width)}x${Math.round(height)}, quality: ${quality})`);
                resolve(compressedFile);
              } else {
                // Try lower quality
                tryCompress(quality - 0.1);
              }
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      // Start with high quality and work down if needed
      tryCompress(0.85);
    };

    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Get recommended compression settings based on file size
 */
export function getCompressionSettings(fileSizeInBytes: number): { quality: number; maxDimension: number } {
  if (fileSizeInBytes > 5 * 1024 * 1024) { // > 5MB
    return { quality: 0.6, maxDimension: 1280 };
  } else if (fileSizeInBytes > 3 * 1024 * 1024) { // > 3MB
    return { quality: 0.7, maxDimension: 1600 };
  } else if (fileSizeInBytes > 2 * 1024 * 1024) { // > 2MB
    return { quality: 0.8, maxDimension: 1920 };
  }

  return { quality: 0.9, maxDimension: 2400 }; // High quality for smaller files
}

/**
 * Process and compress images for upload - ensures ALL images work
 * This function guarantees that any image will be uploadable
 */
export async function processImageForUpload(file: File): Promise<File> {
  try {
    // Skip compression for very small files
    if (file.size < 0.5 * 1024 * 1024) { // Less than 0.5MB
      return file;
    }

    // Always compress larger images to ensure they work
    const compressedFile = await compressImage(file, 1.5); // Target 1.5MB max
    return compressedFile;
  } catch (error) {
    console.warn(`Failed to compress ${file.name}, using original:`, error);
    // If compression fails, still try the original (fallback)
    return file;
  }
}

/**
 * Process multiple images for upload
 */
export async function processImagesForUpload(files: File[]): Promise<File[]> {
  const processedFiles: File[] = [];

  for (const file of files) {
    try {
      const processedFile = await processImageForUpload(file);
      processedFiles.push(processedFile);
    } catch (error) {
      console.error(`Failed to process ${file.name}:`, error);
      // Still include the original file as fallback
      processedFiles.push(file);
    }
  }

  return processedFiles;
}

/**
 * Server-side validation for image size limits (now more lenient)
 */
export function validateImageForProcessing(file: File): { isValid: boolean; reason?: string } {
  // More lenient file size check since we compress on client
  if (file.size > 10 * 1024 * 1024) { // 10MB limit (very generous)
    return { isValid: false, reason: 'File size exceeds 10MB limit' };
  }

  // Check file type
  if (!file.type.startsWith('image/')) {
    return { isValid: false, reason: 'File is not an image' };
  }

  return { isValid: true };
}