import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/utils/adminAuth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { isAdmin, userId, role } = await checkAdminAuth();

    return NextResponse.json({
      isAdmin,
      userId,
      role
    });
  } catch (error) {
    console.error("Error checking admin auth:", error);
    return NextResponse.json(
      { isAdmin: false, userId: null, role: null },
      { status: 200 }
    );
  }
}