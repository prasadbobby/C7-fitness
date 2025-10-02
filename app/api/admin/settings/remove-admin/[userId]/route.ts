import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { requireAdmin } from "@/utils/adminAuth";
import { UserRole } from "@prisma/client";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { id: currentUserId } = await requireAdmin();

    // Prevent users from removing themselves
    if (currentUserId === params.userId) {
      return NextResponse.json(
        { error: "Cannot remove yourself as admin" },
        { status: 400 }
      );
    }

    await prisma.userInfo.update({
      where: { userId: params.userId },
      data: { role: UserRole.USER },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing admin user:", error);
    return NextResponse.json(
      { error: "Failed to remove admin user" },
      { status: 500 }
    );
  }
}