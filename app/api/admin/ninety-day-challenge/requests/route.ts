import { NextResponse } from "next/server";
import { requireAdmin } from "@/utils/adminAuth";
import prisma from "@/prisma/prisma";
import { clerkClient } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

/**
 * Pending join requests: participant rows a member created from the mobile app
 * ("Request to join") that an admin hasn't enabled yet and that have no posts.
 * Approve = PATCH /participants/[id] { isEnabled: true }; decline = DELETE /participants/[id].
 */
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const rows = await prisma.ninetyDayChallengeParticipant.findMany({
      where: { isEnabled: false, posts: { none: {} } },
      include: { challenge: { select: { id: true, title: true, isActive: true } } },
      orderBy: { joinedAt: "desc" },
    });
    const requests = await Promise.all(
      rows.map(async (r) => {
        try {
          const u = await clerkClient.users.getUser(r.userId);
          return { id: r.id, userId: r.userId, requestedAt: r.joinedAt, challenge: r.challenge, user: { firstName: u.firstName ?? "", lastName: u.lastName ?? "", email: u.emailAddresses[0]?.emailAddress ?? "", imageUrl: u.imageUrl ?? "" } };
        } catch {
          return { id: r.id, userId: r.userId, requestedAt: r.joinedAt, challenge: r.challenge, user: { firstName: "Unknown", lastName: "member", email: "", imageUrl: "" } };
        }
      }),
    );
    return NextResponse.json({ requests, count: requests.length });
  } catch (error) {
    console.error("Error fetching join requests:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
