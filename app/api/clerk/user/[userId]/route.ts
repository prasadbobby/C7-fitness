import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs";
import { requireAdmin } from "@/utils/adminAuth";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    await requireAdmin();
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const user = await clerkClient.users.getUser(params.userId);

    return NextResponse.json({
      firstName: user.firstName || "Unknown",
      lastName: user.lastName || "User",
      imageUrl: user.imageUrl || "",
      emailAddresses: user.emailAddresses,
      username: user.username || user.firstName || "Unknown"
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      {
        firstName: "Unknown",
        lastName: "User",
        imageUrl: "",
        emailAddresses: [{ emailAddress: "unknown@example.com" }],
        username: "Unknown"
      },
      { status: 200 }
    );
  }
}