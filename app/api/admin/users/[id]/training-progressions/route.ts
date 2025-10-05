import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: adminUserId } = auth();
    if (!adminUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const adminInfo = await prisma.userInfo.findUnique({
      where: { userId: adminUserId },
      select: { role: true },
    });

    if (!adminInfo || (adminInfo.role !== "ADMIN" && adminInfo.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: userId } = params;

    // Fetch training progressions for the specific user
    const progressions = await prisma.userTrainingProgression.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      progressions,
    });
  } catch (error) {
    console.error("Error fetching user training progressions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}