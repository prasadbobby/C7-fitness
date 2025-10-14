import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import { assignC7UserId, getC7UserId } from "@/lib/c7-user-id";
import prisma from "@/prisma/prisma";

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already has a C7 user ID in the c7UserId column
    const existingC7Id = await getC7UserId(user.id);

    if (existingC7Id) {
      return NextResponse.json({
        clerkUserId: user.id,
        c7UserId: existingC7Id,
        converted: false,
        message: "User already has C7 format ID"
      });
    }

    // Check if user exists in UserInfo table
    const existingUser = await prisma.userInfo.findUnique({
      where: {
        userId: user.id
      }
    });

    // If user doesn't exist in UserInfo, create them first
    if (!existingUser) {
      await prisma.userInfo.create({
        data: {
          userId: user.id,
          updatedAt: new Date()
        }
      });
    }

    // Assign C7 user ID (this adds to c7UserId column, doesn't modify userId)
    const newC7UserId = await assignC7UserId(user.id);

    return NextResponse.json({
      clerkUserId: user.id,
      c7UserId: newC7UserId,
      converted: true,
      message: "Successfully assigned C7 format ID"
    });

  } catch (error) {
    console.error("Error assigning C7 user ID:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}