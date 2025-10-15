import convert from 'heic-convert';

/**
 * Convert HEIC/HEIF image to JPEG format
 * @param file - The HEIC file to convert
 * @returns Promise<File> - The converted JPEG file
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  try {
    // Read the file as buffer
    const buffer = await file.arrayBuffer();

    // Convert HEIC to JPEG
    const outputBuffer = await convert({
      buffer: new Uint8Array(buffer),
      format: 'JPEG',
      quality: 0.9, // High quality
    });

    // Create a new File object with the converted data
    const convertedFile = new File(
      [outputBuffer],
      file.name.replace(/\.(heic|HEIC)$/i, '.jpg'),
      {
        type: 'image/jpeg',
        lastModified: file.lastModified,
      }
    );

    return convertedFile;
  } catch (error) {
    console.error('Error converting HEIC to JPEG:', error);
    throw new Error('Failed to convert HEIC image. Please try a different format.');
  }
}

/**
 * Check if a file is a HEIC/HEIF image
 * @param file - The file to check
 * @returns boolean - True if the file is HEIC/HEIF
 */
export function isHeicImage(file: File): boolean {
  return /\.(heic|heif)$/i.test(file.name) || file.type === 'image/heic' || file.type === 'image/heif';
}

/**
 * Process uploaded files, converting HEIC to JPEG when necessary
 * @param files - Array of uploaded files
 * @returns Promise<File[]> - Array of processed files
 */
export async function processUploadedFiles(files: File[]): Promise<File[]> {
  const processedFiles: File[] = [];

  for (const file of files) {
    if (isHeicImage(file)) {
      try {
        const convertedFile = await convertHeicToJpeg(file);
        processedFiles.push(convertedFile);
      } catch (error) {
        console.error(`Failed to convert ${file.name}:`, error);
        // You could show a toast notification here
        // For now, we'll skip the file
        continue;
      }
    } else {
      processedFiles.push(file);
    }
  }

  return processedFiles;
}