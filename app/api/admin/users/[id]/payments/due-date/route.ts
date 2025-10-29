import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { requireSuperAdmin } from "@/utils/adminAuth";

export const dynamic = 'force-dynamic';

// PUT - Update next payment due date for a user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdmin();

    const { id } = params;
    const body = await request.json();

    const { nextPaymentDue } = body;

    // Get current user info
    const userInfo = await prisma.userInfo.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!userInfo) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user info
    const updatedUser = await prisma.userInfo.update({
      where: { id },
      data: {
        nextPaymentDue: nextPaymentDue ? new Date(nextPaymentDue) : null,
      },
      select: {
        id: true,
        nextPaymentDue: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Next payment due date updated successfully",
      nextPaymentDue: updatedUser.nextPaymentDue?.toISOString() || null,
    });

  } catch (error) {
    console.error("Error updating next payment due date:", error);
    return NextResponse.json(
      { error: "Failed to update next payment due date", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}