import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/prisma';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

// Type assertion to fix IDE TypeScript cache issues
// The build compiles successfully, indicating the superAdminAuth model exists
const db = prisma as any;

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Get super admin emails from database
async function getSuperAdminEmails(): Promise<string[]> {
  const superAdmins = await prisma.userInfo.findMany({
    where: { role: 'SUPER_ADMIN' },
    select: { userId: true }
  });

  // We'll need to get the emails from Clerk since we only store userId in our database
  const { clerkClient } = await import('@clerk/nextjs');
  const emails: string[] = [];
  const hardcodedSuperAdmin = "knvdurgaprasad610@gmail.com";

  // Always include the hardcoded super admin first
  emails.push(hardcodedSuperAdmin);

  for (const admin of superAdmins) {
    try {
      const user = await clerkClient.users.getUser(admin.userId);
      const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;
      if (email && email !== hardcodedSuperAdmin) {
        // Only add if it's not the hardcoded email (to avoid duplicates)
        emails.push(email);
      }
    } catch (error) {
      console.error('Error fetching user from Clerk:', error);
    }
  }

  return emails;
}

// POST - Handle login, password setup, or OTP generation
export async function POST(request: NextRequest) {
  try {
    const { action, email, password, otp } = await request.json();

    if (action === 'get_super_admins') {
      // Return list of super admin emails
      const emails = await getSuperAdminEmails();
      return NextResponse.json({ emails });
    }

    if (action === 'check_first_time') {
      // Check if this super admin has set up password
      const superAdminAuth = await db.superAdminAuth.findUnique({
        where: { email }
      });

      const isFirstTime = !superAdminAuth || !superAdminAuth.passwordHash;
      return NextResponse.json({ isFirstTime });
    }

    if (action === 'set_password') {
      // First-time password setup
      // For first-time setup, we'll use the email to find the corresponding userId
      // since auth() is not available in ignored routes

      const passwordHash = await bcrypt.hash(password, 12);

      // Get the userId from the database based on email
      // We need to find the super admin by looking up their email in Clerk
      const { clerkClient } = await import('@clerk/nextjs');
      let userId = null;

      try {
        // First, check if we already have this email in our SuperAdminAuth table
        const existingAuth = await db.superAdminAuth.findUnique({
          where: { email }
        });

        if (existingAuth && existingAuth.userId) {
          userId = existingAuth.userId;
        } else {
          // Find the userId by checking all super admins in database
          const superAdmins = await prisma.userInfo.findMany({
            where: { role: 'SUPER_ADMIN' },
            select: { userId: true }
          });

          // Try to find which super admin has this email
          for (const admin of superAdmins) {
            try {
              const user = await clerkClient.users.getUser(admin.userId);
              const userEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;
              if (userEmail === email) {
                userId = admin.userId;
                break;
              }
            } catch (error) {
              // Continue checking other admins
              continue;
            }
          }

          // If no userId found from database, use a placeholder for hardcoded admin
          if (!userId && email === "knvdurgaprasad610@gmail.com") {
            userId = "hardcoded_super_admin";
          }
        }
      } catch (error) {
        console.error('Error finding userId for email:', error);
        // Fallback for hardcoded admin
        if (email === "knvdurgaprasad610@gmail.com") {
          userId = "hardcoded_super_admin";
        }
      }

      if (!userId) {
        return NextResponse.json({
          success: false,
          error: 'Unable to set password for this email'
        }, { status: 400 });
      }

      await db.superAdminAuth.upsert({
        where: { email },
        update: {
          passwordHash,
          lastLogin: new Date(),
          loginAttempts: 0,
          lockedUntil: null,
        },
        create: {
          userId,
          email,
          passwordHash,
          lastLogin: new Date(),
        }
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'login') {
      // Password verification
      const superAdminAuth = await db.superAdminAuth.findUnique({
        where: { email }
      });

      if (!superAdminAuth || !superAdminAuth.passwordHash) {
        return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 400 });
      }

      // Check if account is locked
      if (superAdminAuth.lockedUntil && superAdminAuth.lockedUntil > new Date()) {
        const timeLeft = Math.ceil((superAdminAuth.lockedUntil.getTime() - Date.now()) / 60000);
        return NextResponse.json({
          success: false,
          error: `Account locked. Try again in ${timeLeft} minutes.`
        }, { status: 423 });
      }

      const isPasswordValid = await bcrypt.compare(password, superAdminAuth.passwordHash);

      if (!isPasswordValid) {
        // Increment failed attempts
        const newAttempts = superAdminAuth.loginAttempts + 1;
        const shouldLock = newAttempts >= 5;

        await db.superAdminAuth.update({
          where: { email },
          data: {
            loginAttempts: newAttempts,
            lockedUntil: shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null // 15 minutes lock
          }
        });

        if (shouldLock) {
          return NextResponse.json({
            success: false,
            error: 'Too many failed attempts. Account locked for 15 minutes.'
          }, { status: 423 });
        }

        return NextResponse.json({
          success: false,
          error: `Invalid password. ${5 - newAttempts} attempts remaining.`
        }, { status: 400 });
      }

      // Successful login
      await db.superAdminAuth.update({
        where: { email },
        data: {
          lastLogin: new Date(),
          loginAttempts: 0,
          lockedUntil: null,
        }
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'forgot_password') {
      // Generate and send OTP
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await db.superAdminAuth.upsert({
        where: { email },
        update: {
          otpSecret: otp,
          otpExpiry,
        },
        create: {
          userId: '', // Will be updated when password is reset
          email,
          otpSecret: otp,
          otpExpiry,
        }
      });

      // Send OTP via email
      try {
        await resend.emails.send({
          from: 'C7 Personal Fitness Studio <noreply@mail.c7personalfitness.com>',
          to: [email],
          subject: 'Password Reset OTP - C7 Personal Fitness',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Password Reset Request</h2>
              <p>You requested a password reset for your C7 Personal Fitness Super Admin account.</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <h3 style="margin: 0; color: #007bff;">Your OTP Code:</h3>
                <p style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 4px; margin: 10px 0;">${otp}</p>
              </div>
              <p><strong>This OTP will expire in 10 minutes.</strong></p>
              <p>If you didn't request this reset, please ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">C7 Personal Fitness Studio</p>
            </div>
          `
        });

        return NextResponse.json({ success: true, message: 'OTP sent to your email' });
      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError);
        return NextResponse.json({
          success: false,
          error: 'Failed to send OTP email'
        }, { status: 500 });
      }
    }

    if (action === 'verify_otp') {
      // Verify OTP and allow password reset
      const superAdminAuth = await db.superAdminAuth.findUnique({
        where: { email }
      });

      if (!superAdminAuth || !superAdminAuth.otpSecret || !superAdminAuth.otpExpiry) {
        return NextResponse.json({
          success: false,
          error: 'No OTP found for this email'
        }, { status: 400 });
      }

      if (superAdminAuth.otpExpiry < new Date()) {
        return NextResponse.json({
          success: false,
          error: 'OTP has expired'
        }, { status: 400 });
      }

      if (superAdminAuth.otpSecret !== otp) {
        return NextResponse.json({
          success: false,
          error: 'Invalid OTP'
        }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'reset_password') {
      // Reset password with OTP verification
      const superAdminAuth = await db.superAdminAuth.findUnique({
        where: { email }
      });

      if (!superAdminAuth || !superAdminAuth.otpSecret || !superAdminAuth.otpExpiry) {
        return NextResponse.json({
          success: false,
          error: 'Invalid reset session'
        }, { status: 400 });
      }

      if (superAdminAuth.otpExpiry < new Date()) {
        return NextResponse.json({
          success: false,
          error: 'Reset session expired'
        }, { status: 400 });
      }

      if (superAdminAuth.otpSecret !== otp) {
        return NextResponse.json({
          success: false,
          error: 'Invalid OTP'
        }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      await db.superAdminAuth.update({
        where: { email },
        data: {
          passwordHash,
          otpSecret: null,
          otpExpiry: null,
          loginAttempts: 0,
          lockedUntil: null,
          lastLogin: new Date(),
        }
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Super admin auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}