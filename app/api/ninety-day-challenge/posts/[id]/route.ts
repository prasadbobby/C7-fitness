import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";

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
          // Validate file size (5MB limit)
          if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({
              error: `File "${file.name}" is too large. Maximum size is 5MB.`
            }, { status: 400 });
          }

          // Validate file type
          if (!file.type.startsWith('image/')) {
            return NextResponse.json({
              error: `File "${file.name}" is not a valid image format.`
            }, { status: 400 });
          }

          try {
            // Convert file to base64 data URL for simple storage
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const base64 = buffer.toString('base64');

            // Check if base64 string is reasonable size (rough check for corrupted data)
            if (base64.length > 7 * 1024 * 1024) { // Roughly 5MB * 1.4 (base64 overhead)
              return NextResponse.json({
                error: `File "${file.name}" produced invalid data during processing.`
              }, { status: 400 });
            }

            const dataUrl = `data:${file.type};base64,${base64}`;
            newPhotos.push(dataUrl);
          } catch (fileError) {
            console.error(`Error processing file ${file.name}:`, fileError);
            return NextResponse.json({
              error: `Failed to process file "${file.name}". Please try a different image.`
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
        photos: jsonData.photos || existingPost.photos, // Keep existing photos if not specified
      };
    }

    const post = await prisma.ninetyDayChallengePost.update({
      where: { id: params.id },
      data: updateData,
    });

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