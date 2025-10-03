import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/utils/adminAuth";
import { clerkClient } from "@clerk/nextjs";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!query) {
      return NextResponse.json({ users: [] });
    }

    // Search users in Clerk
    const clerkUsers = await clerkClient.users.getUserList({
      query,
      limit,
    });

    // Format the user data
    const users = clerkUsers.map((user) => ({
      id: user.id,
      userId: user.id,
      firstName: user.firstName || "Unknown",
      lastName: user.lastName || "User",
      email: user.emailAddresses[0]?.emailAddress || "No email",
      imageUrl: user.imageUrl || "",
      username: user.username || user.firstName || user.emailAddresses[0]?.emailAddress || "Unknown",
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}