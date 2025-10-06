import { auth } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile, rm } from "fs/promises";
import { join } from "path";

export const dynamic = 'force-dynamic';

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    throw new Error("You must be signed in to view this page.");
  }

  const exercises = await prisma.exercise.findMany({
    where: {
      favouritedBy: {
        some: {
          userId: userId,
        },
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  return Response.json(exercises);
}

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

    const body = await request.json();
    const {
      name,
      aliases = [],
      primary_muscles = [],
      secondary_muscles = [],
      primaryMuscles = [],
      secondaryMuscles = [],
      force,
      level,
      mechanic,
      equipment,
      category,
      instructions = [],
      description,
      tips = [],
      image,
    } = body;

    // Support both JSON format (primaryMuscles) and database format (primary_muscles)
    const finalPrimaryMuscles = primaryMuscles.length > 0 ? primaryMuscles : primary_muscles;
    const finalSecondaryMuscles = secondaryMuscles.length > 0 ? secondaryMuscles : secondary_muscles;

    // Validate required fields
    if (!name || !level || !category) {
      return NextResponse.json(
        { error: "Name, level, and category are required fields" },
        { status: 400 }
      );
    }

    // Generate directory name from exercise name
    const exerciseDirName = name.trim().replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_{2,}/g, '_');

    // Use provided image URL or default path
    const imagePath = image || `/images/exercises/${exerciseDirName}/images/0.jpg`;

    // Only create local files in development
    const isProduction = process.env.NODE_ENV === 'production';

    if (!isProduction) {
      const exerciseDir = join(process.cwd(), 'public', 'images', 'exercises', exerciseDirName);
      const imagesDir = join(exerciseDir, 'images');

      try {
        // Create the directory structure
        await mkdir(exerciseDir, { recursive: true });
        await mkdir(imagesDir, { recursive: true });

        // Create the exercise.json file
        const exerciseJson = {
          name: name.trim(),
          force: force || null,
          level,
          mechanic: mechanic || null,
          equipment: equipment || null,
          primaryMuscles: finalPrimaryMuscles,
          secondaryMuscles: finalSecondaryMuscles,
          instructions: instructions.filter((instruction: string) => instruction.trim()),
          category,
          ...(description?.trim() && { description: description.trim() }),
          ...(aliases.length > 0 && { aliases: aliases.filter((alias: string) => alias.trim()) }),
          ...(tips.length > 0 && { tips: tips.filter((tip: string) => tip.trim()) }),
        };

        const jsonPath = join(exerciseDir, 'exercise.json');
        await writeFile(jsonPath, JSON.stringify(exerciseJson, null, 2));

      } catch (fileError) {
        console.error("Error creating directories/files:", fileError);
        // Continue with database creation even if file operations fail
      }
    }

    // Create the exercise in database
    const newExercise = await prisma.exercise.create({
      data: {
        name: name.trim(),
        aliases: aliases.filter((alias: string) => alias.trim()),
        primary_muscles: finalPrimaryMuscles,
        secondary_muscles: finalSecondaryMuscles,
        force: force || null,
        level,
        mechanic: mechanic || null,
        equipment: equipment || null,
        category,
        instructions: instructions.filter((instruction: string) => instruction.trim()),
        description: description?.trim() || null,
        tips: tips.filter((tip: string) => tip.trim()),
        image: imagePath,
      },
    });

    return NextResponse.json({
      message: "Exercise created successfully",
      exercise: newExercise,
      directories: {
        exerciseDir: `/images/exercises/${exerciseDirName}`,
        imagesDir: `/images/exercises/${exerciseDirName}/images`,
        jsonFile: `/images/exercises/${exerciseDirName}/exercise.json`,
      },
    });
  } catch (error) {
    console.error("Error creating exercise:", error);
    return NextResponse.json(
      { error: "Failed to create exercise" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get("id");

    if (!exerciseId) {
      return NextResponse.json(
        { error: "Exercise ID is required" },
        { status: 400 }
      );
    }

    // Get exercise details before deletion
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: { name: true },
    });

    if (!exercise) {
      return NextResponse.json(
        { error: "Exercise not found" },
        { status: 404 }
      );
    }

    // Delete from database first
    await prisma.exercise.delete({
      where: { id: exerciseId },
    });

    // Try to delete the directory structure
    const exerciseDirName = exercise.name.trim().replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_{2,}/g, '_');
    const exerciseDir = join(process.cwd(), 'public', 'images', 'exercises', exerciseDirName);

    try {
      await rm(exerciseDir, { recursive: true, force: true });
    } catch (fileError) {
      console.warn("Could not delete exercise directory:", fileError);
      // Continue even if file deletion fails
    }

    return NextResponse.json({
      message: "Exercise deleted successfully",
      exerciseName: exercise.name,
    });

  } catch (error) {
    console.error("Error deleting exercise:", error);
    return NextResponse.json(
      { error: "Failed to delete exercise" },
      { status: 500 }
    );
  }
}
