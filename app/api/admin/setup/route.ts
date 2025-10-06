import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { auth } from "@clerk/nextjs";
import { UserRole } from "@prisma/client";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId: targetUserId } = body;

    // Check if there are any existing admins
    const existingAdmins = await prisma.userInfo.count({
      where: {
        role: {
          in: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
        },
      },
    });

    // Only allow setup if no admins exist and the requesting user is the target user
    if (existingAdmins > 0) {
      return NextResponse.json(
        { error: "Admin already exists" },
        { status: 400 }
      );
    }

    if (userId !== targetUserId) {
      return NextResponse.json(
        { error: "Can only make yourself admin during initial setup" },
        { status: 400 }
      );
    }

    // Create or update user to be SUPER_ADMIN
    const user = await prisma.userInfo.upsert({
      where: { userId },
      update: { role: UserRole.SUPER_ADMIN },
      create: {
        userId,
        role: UserRole.SUPER_ADMIN,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error setting up admin:", error);
    return NextResponse.json(
      { error: "Failed to setup admin" },
      { status: 500 }
    );
  }
}