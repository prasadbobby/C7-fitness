import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/utils/adminAuth";
import { clerkClient } from "@clerk/nextjs";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // If query looks like a formatted user string (contains parentheses), don't search
    if (query.includes('(') && query.includes('@')) {
      return NextResponse.json({ users: [] });
    }

    console.log('Searching users with query:', query);

    try {
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

      console.log(`Found ${users.length} users for query: ${query}`);
      return NextResponse.json({ users });
    } catch (clerkError) {
      console.error("Error searching users in Clerk:", clerkError);
      return NextResponse.json({ users: [] }); // Return empty array instead of error
    }
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}