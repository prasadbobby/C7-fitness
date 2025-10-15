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
      for (const file of photoFiles) {
        if (file && file.size > 0) {
          // Convert file to base64 data URL for simple storage
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const base64 = buffer.toString('base64');
          const dataUrl = `data:${file.type};base64,${base64}`;
          newPhotos.push(dataUrl);
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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