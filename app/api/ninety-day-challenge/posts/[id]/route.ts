import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      sleepHours,
      sleepQuality,
      mealTracking,
      dayDescription,
      mood,
      energy,
      achievements,
      challenges,
      photos,
    } = await request.json();

    // Check if the post belongs to the current user
    const existingPost = await prisma.ninetyDayChallengePost.findUnique({
      where: { id: params.id },
    });

    if (!existingPost || existingPost.userId !== user.id) {
      return NextResponse.json({ error: "Post not found or unauthorized" }, { status: 404 });
    }

    const post = await prisma.ninetyDayChallengePost.update({
      where: { id: params.id },
      data: {
        sleepHours,
        sleepQuality,
        mealTracking,
        dayDescription,
        mood,
        energy,
        achievements,
        challenges,
        photos: photos || [],
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}