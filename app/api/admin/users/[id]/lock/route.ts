import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/utils/adminAuth';
import prisma from '@/prisma/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if current user is super admin using the existing utility
    await requireSuperAdmin();

    const { id } = params;

    // Lock the user in Clerk (for immediate sign-in prevention)
    // Our middleware will handle permanent locking based on database status
    const clerkResponse = await fetch(`https://api.clerk.com/v1/users/${id}/lock`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      // Don't specify duration - let Clerk use its default, our middleware will override
    });

    if (!clerkResponse.ok) {
      const errorData = await clerkResponse.json();
      console.error('Clerk API error:', errorData);
      throw new Error(`Clerk API error: ${clerkResponse.status}`);
    }

    // Update our database to mark user as locked
    const existingUser = await prisma.userInfo.findUnique({
      where: { userId: id }
    });

    if (existingUser) {
      await prisma.userInfo.update({
        where: { userId: id },
        data: { locked: true }
      });
    } else {
      await prisma.userInfo.create({
        data: {
          userId: id,
          locked: true,
          role: 'USER'
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: "User locked successfully"
    });

  } catch (error: any) {
    console.error('Error locking user:', error);

    // Handle specific error cases
    if (error.message?.includes('Super admin access required')) {
      return NextResponse.json(
        { error: "Only super admins can lock users" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to lock user" },
      { status: 500 }
    );
  }
}