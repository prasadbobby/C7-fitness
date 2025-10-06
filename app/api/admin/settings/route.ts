import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/utils/adminAuth";

// In a real app, you might store these in the database
// For now, we'll use a simple object
const defaultSettings = {
  requireApproval: false,
  autoAssignWorkouts: false,
  emailNotifications: true,
};

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    // In a real implementation, fetch from database
    return NextResponse.json({ settings: defaultSettings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();

    // In a real implementation, save to database
    // For now, just return the updated settings
    const updatedSettings = { ...defaultSettings, ...body };

    return NextResponse.json({ settings: updatedSettings });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}