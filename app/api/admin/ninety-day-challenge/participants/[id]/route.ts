import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/utils/adminAuth";
import prisma from "@/prisma/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { isEnabled } = body;

    if (typeof isEnabled !== "boolean") {
      return NextResponse.json({ error: "isEnabled must be a boolean" }, { status: 400 });
    }

    const updatedParticipant = await prisma.ninetyDayChallengeParticipant.update({
      where: { id: params.id },
      data: { isEnabled },
    });

    return NextResponse.json(updatedParticipant);
  } catch (error) {
    console.error("Error updating participant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Delete participant (this will cascade delete related posts and reactions due to schema)
    await prisma.ninetyDayChallengeParticipant.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting participant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}