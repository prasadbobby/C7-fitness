import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/utils/adminAuth";

export const dynamic = 'force-dynamic';

// GET current user's role
export async function GET(request: NextRequest) {
  try {
    const { isAdmin, userId, role } = await checkAdminAuth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      userId,
      role,
      isAdmin,
    });

  } catch (error) {
    console.error("Error checking user role:", error);
    return NextResponse.json(
      { error: "Failed to check user role", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}