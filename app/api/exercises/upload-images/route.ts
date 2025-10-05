import { auth } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId },
      select: { role: true },
    });

    if (!userInfo || (userInfo.role !== "ADMIN" && userInfo.role !== "SUPER_ADMIN")) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const exerciseName = formData.get("exerciseName") as string;
    const files = formData.getAll("images") as File[];

    console.log("Upload request received:");
    console.log("Exercise name:", exerciseName);
    console.log("Number of files:", files.length);
    console.log("File names:", files.map(f => f.name));

    if (!exerciseName) {
      return NextResponse.json(
        { error: "Exercise name is required" },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "At least one image is required" },
        { status: 400 }
      );
    }

    // Generate directory name from exercise name
    const exerciseDirName = exerciseName.trim().replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_{2,}/g, '_');
    const exerciseDir = join(process.cwd(), 'public', 'images', 'exercises', exerciseDirName);
    const imagesDir = join(exerciseDir, 'images');

    try {
      // Create the directory structure
      await mkdir(exerciseDir, { recursive: true });
      await mkdir(imagesDir, { recursive: true });

      const uploadedImages = [];

      // Process each uploaded image
      let imageIndex = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.startsWith('image/')) {
          console.log(`Skipping non-image file: ${file.name}`);
          continue; // Skip non-image files
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Get file extension, default to jpg
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';

        // Generate filename: 0.jpg, 1.jpg, 2.jpg, etc.
        const filename = `${imageIndex}.${fileExtension}`;
        const filepath = join(imagesDir, filename);

        console.log(`Saving image to: ${filepath}`);

        // Save the file
        await writeFile(filepath, buffer);

        uploadedImages.push({
          index: imageIndex,
          filename,
          path: `/images/exercises/${exerciseDirName}/images/${filename}`,
          size: buffer.length,
        });

        imageIndex++;
      }

      console.log(`Successfully uploaded ${uploadedImages.length} images for ${exerciseName}`);

      return NextResponse.json({
        message: "Images uploaded successfully",
        exerciseName,
        exerciseDir: exerciseDirName,
        uploadedImages,
        totalUploaded: uploadedImages.length,
      });

    } catch (fileError) {
      console.error("Error uploading images:", fileError);
      return NextResponse.json(
        { error: "Failed to save images to disk" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error uploading exercise images:", error);
    return NextResponse.json(
      { error: "Failed to upload images" },
      { status: 500 }
    );
  }
}