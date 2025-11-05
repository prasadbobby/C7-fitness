import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user role from database
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId },
      select: { role: true }
    });

    return NextResponse.json({
      role: userInfo?.role || "USER",
      userId
    });
  } catch (error) {
    console.error("Error fetching current user role:", error);
    return NextResponse.json(
      { error: "Failed to fetch user role" },
      { status: 500 }
    );
  }
}