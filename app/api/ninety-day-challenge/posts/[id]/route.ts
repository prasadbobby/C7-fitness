import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";
import { validateImageForProcessing, estimateBase64Size } from "@/utils/imageCompression";

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId: user.id },
      select: { role: true }
    });

    const isAdmin = userInfo?.role === 'ADMIN' || userInfo?.role === 'SUPER_ADMIN';

    // Check if the post exists and user has permission to edit it
    const existingPost = await prisma.ninetyDayChallengePost.findUnique({
      where: { id: params.id },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Allow editing if user owns the post or is admin
    if (!isAdmin && existingPost.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized to edit this post" }, { status: 403 });
    }

    // Check if request is FormData or JSON
    const contentType = request.headers.get('content-type');
    let updateData: any = {};

    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData (with photo uploads)
      const formData = await request.formData();

      updateData.sleepHours = formData.get('sleepHours') ? Number(formData.get('sleepHours')) : null;
      updateData.sleepQuality = formData.get('sleepQuality') as string || null;
      updateData.mealTracking = formData.get('mealTracking') as string || null;
      updateData.dayDescription = formData.get('dayDescription') as string || null;
      updateData.mood = formData.get('mood') as string || null;
      updateData.energy = formData.get('energy') as string || null;
      updateData.achievements = formData.get('achievements') as string || null;
      updateData.challenges = formData.get('challenges') as string || null;
      updateData.isFasting = formData.get('isFasting') === 'true';

      // Handle existing photos (keep these)
      const existingPhotosJson = formData.get('existingPhotos') as string;
      let existingPhotos: string[] = [];
      if (existingPhotosJson) {
        try {
          existingPhotos = JSON.parse(existingPhotosJson);
        } catch (e) {
          console.error('Error parsing existing photos:', e);
        }
      }

      // Handle new photo files
      const newPhotos: string[] = [];
      const photoFiles = formData.getAll('newPhotos') as File[];

      // Validate total photo count and individual file sizes
      const totalPhotos = existingPhotos.length + photoFiles.length;
      if (totalPhotos > 10) {
        return NextResponse.json({
          error: `Too many photos. Maximum 10 photos allowed (current: ${existingPhotos.length}, new: ${photoFiles.length})`
        }, { status: 400 });
      }

      for (const file of photoFiles) {
        if (file && file.size > 0) {
          // Truncate filename if too long for error messages
          const truncatedName = file.name.length > 50
            ? file.name.substring(0, 47) + '...'
            : file.name;

          // Enhanced validation using utility functions
          const validation = validateImageForProcessing(file);
          if (!validation.isValid) {
            return NextResponse.json({
              error: `File "${truncatedName}": ${validation.reason}`
            }, { status: 400 });
          }

          // Additional check for estimated base64 size (more lenient since we compress on client)
          const estimatedBase64Size = estimateBase64Size(file.size);
          console.log(`File ${file.name}: ${file.size} bytes → estimated ${estimatedBase64Size} base64 chars`);

          if (estimatedBase64Size > 8 * 1024 * 1024) { // 8MB base64 limit (increased from 6MB)
            return NextResponse.json({
              error: `File "${truncatedName}" is still too large after compression. This shouldn't happen - please contact support.`
            }, { status: 400 });
          }

          try {
            // Add more detailed logging for debugging
            console.log(`Processing file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

            // Convert file to base64 data URL for simple storage
            const bytes = await file.arrayBuffer();
            console.log(`ArrayBuffer created, size: ${bytes.byteLength} bytes`);

            const buffer = Buffer.from(bytes);
            console.log(`Buffer created, length: ${buffer.length} bytes`);

            const base64 = buffer.toString('base64');
            console.log(`Base64 created, length: ${base64.length} chars`);

            // Check if base64 string is reasonable size (roughly 5MB * 1.4 base64 overhead)
            if (base64.length > 7 * 1024 * 1024) {
              console.warn(`Base64 too large: ${base64.length} chars for file ${file.name}`);
              return NextResponse.json({
                error: `File "${truncatedName}" is too large after processing. Please use a smaller image (under 3MB).`
              }, { status: 400 });
            }

            const dataUrl = `data:${file.type};base64,${base64}`;
            console.log(`DataURL created, total length: ${dataUrl.length} chars`);
            newPhotos.push(dataUrl);

            console.log(`Successfully processed file: ${file.name}`);
          } catch (fileError) {
            console.error(`Error processing file ${file.name}:`, fileError);

            // More specific error handling
            if (fileError instanceof Error) {
              if (fileError.message.includes('out of memory') || fileError.message.includes('heap out of memory')) {
                return NextResponse.json({
                  error: `Image "${truncatedName}" is too large to process. Please use a smaller image (under 2MB).`
                }, { status: 400 });
              }

              if (fileError.message.includes('Invalid image') || fileError.message.includes('corrupt')) {
                return NextResponse.json({
                  error: `Image "${truncatedName}" appears to be corrupted. Please try a different image.`
                }, { status: 400 });
              }
            }

            return NextResponse.json({
              error: `Failed to process image "${truncatedName}". Please try a smaller image or different format.`
            }, { status: 400 });
          }
        }
      }

      // Combine existing and new photos
      updateData.photos = [...existingPhotos, ...newPhotos];
    } else {
      // Handle JSON (existing functionality without photo updates)
      const jsonData = await request.json();
      updateData = {
        sleepHours: jsonData.sleepHours,
        sleepQuality: jsonData.sleepQuality,
        mealTracking: jsonData.mealTracking,
        dayDescription: jsonData.dayDescription,
        mood: jsonData.mood,
        energy: jsonData.energy,
        achievements: jsonData.achievements,
        challenges: jsonData.challenges,
        isFasting: jsonData.isFasting !== undefined ? jsonData.isFasting : existingPost.isFasting,
        photos: jsonData.photos || existingPost.photos, // Keep existing photos if not specified
      };
    }

    // Add logging before database operation
    console.log(`Updating post ${params.id} with data:`, {
      ...updateData,
      photos: updateData.photos ? `${updateData.photos.length} photos, total size: ${JSON.stringify(updateData.photos).length} chars` : 'no photos'
    });

    const post = await prisma.ninetyDayChallengePost.update({
      where: { id: params.id },
      data: updateData,
    });

    console.log(`Successfully updated post ${params.id}`);
    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error updating post:", error);

    // Provide more specific error messages based on error type
    if (error instanceof Error) {
      // Check for common Prisma/Database errors
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json({ error: "Post not found or has been deleted" }, { status: 404 });
      }

      if (error.message.includes('String too long') || error.message.includes('value too long')) {
        return NextResponse.json({ error: "One or more fields contain too much data. Please reduce the content size." }, { status: 400 });
      }

      if (error.message.includes('Unique constraint') || error.message.includes('duplicate key')) {
        return NextResponse.json({ error: "A post already exists for this date" }, { status: 400 });
      }

      // Memory/size related errors
      if (error.message.includes('out of memory') || error.message.includes('Maximum call stack')) {
        return NextResponse.json({ error: "Images are too large to process. Please use smaller images (under 3MB each)." }, { status: 400 });
      }

      // Network/timeout errors
      if (error.message.includes('timeout') || error.message.includes('ECONNRESET')) {
        return NextResponse.json({ error: "Request timed out. Please try again with smaller images." }, { status: 408 });
      }

      // Database size/limit errors
      if (error.message.includes('value too long') || error.message.includes('string too long') || error.message.includes('row size exceeds')) {
        return NextResponse.json({ error: "Images are too large for storage. Please use smaller images (under 2MB each)." }, { status: 400 });
      }

      // Prisma/Database connection errors
      if (error.message.includes('Connection terminated') || error.message.includes('database connection')) {
        return NextResponse.json({ error: "Database connection issue. Please try again in a moment." }, { status: 503 });
      }

      // JSON parsing errors (which might be causing the original issue)
      if (error.message.includes('JSON') || error.message.includes('parse') || error.message.includes('syntax')) {
        return NextResponse.json({ error: "Data format error. Please try uploading the image again." }, { status: 400 });
      }
    }

    return NextResponse.json({
      error: "Failed to update post. Please try again or contact support if the problem persists.",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId: user.id },
      select: { role: true }
    });

    const isAdmin = userInfo?.role === 'ADMIN' || userInfo?.role === 'SUPER_ADMIN';

    // Check if the post exists and either belongs to the user or user is admin
    const existingPost = await prisma.ninetyDayChallengePost.findUnique({
      where: { id: params.id },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Allow deletion if user owns the post or is admin
    if (!isAdmin && existingPost.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized to delete this post" }, { status: 403 });
    }

    // Delete related data first
    await prisma.ninetyDayChallengeReaction.deleteMany({
      where: { postId: params.id }
    });

    await prisma.ninetyDayChallengeComment.deleteMany({
      where: { postId: params.id }
    });

    // Delete the post
    await prisma.ninetyDayChallengePost.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}