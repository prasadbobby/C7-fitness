import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import prisma from '@/prisma/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// PUT - Update password for logged-in super admin
export async function PUT(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({
        error: 'Current password and new password are required'
      }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({
        error: 'New password must be at least 8 characters long'
      }, { status: 400 });
    }

    // Get user's email from Clerk
    const { clerkClient } = await import('@clerk/nextjs');
    let userEmail = '';

    try {
      const user = await clerkClient.users.getUser(userId);
      userEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress || '';
    } catch (error) {
      // Check if this is the hardcoded super admin
      const userInfo = await prisma.userInfo.findUnique({
        where: { userId },
        select: { role: true }
      });

      if (userInfo?.role === 'SUPER_ADMIN') {
        // This might be the hardcoded super admin
        userEmail = "knvdurgaprasad610@gmail.com";
      } else {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 404 });
    }

    // Check if user is a super admin
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId },
      select: { role: true }
    });

    if (userInfo?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Find the super admin auth record
    const superAdminAuth = await prisma.superAdminAuth.findUnique({
      where: { email: userEmail }
    });

    if (!superAdminAuth || !superAdminAuth.passwordHash) {
      return NextResponse.json({
        error: 'Super admin authentication not set up'
      }, { status: 400 });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, superAdminAuth.passwordHash);

    if (!isCurrentPasswordValid) {
      return NextResponse.json({
        error: 'Current password is incorrect'
      }, { status: 400 });
    }

    // Hash the new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update the password
    await prisma.superAdminAuth.update({
      where: { email: userEmail },
      data: {
        passwordHash: newPasswordHash,
        loginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Update password error:', error);
    return NextResponse.json({
      error: 'Failed to update password'
    }, { status: 500 });
  }
}