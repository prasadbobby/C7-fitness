import { auth } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";
import { UserRole } from "@prisma/client";

export async function checkAdminAuth(): Promise<{ isAdmin: boolean; userId: string | null; role: UserRole | null }> {
  try {
    const { userId } = auth();

    if (!userId) {
      return { isAdmin: false, userId: null, role: null };
    }

    // Check if user exists in our database and get their role
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId },
      select: { role: true }
    });

    if (!userInfo) {
      // Create user if doesn't exist with default USER role
      await prisma.userInfo.create({
        data: {
          userId,
          role: UserRole.USER
        }
      });
      return { isAdmin: false, userId, role: UserRole.USER };
    }
    const isAdmin = userInfo.role === UserRole.ADMIN || userInfo.role === UserRole.SUPER_ADMIN;

    return {
      isAdmin,
      userId,
      role: userInfo.role
    };
  } catch (error) {
    console.error("Error checking admin auth:", error);
    return { isAdmin: false, userId: null, role: null };
  }
}

export async function requireAdmin(): Promise<{ userId: string; role: UserRole }> {
  const { isAdmin, userId, role } = await checkAdminAuth();

  if (!isAdmin || !userId || !role) {
    throw new Error("Admin access required");
  }

  return { userId, role };
}

export async function makeUserAdmin(targetUserId: string, adminUserId: string): Promise<boolean> {
  try {
    const { isAdmin } = await checkAdminAuth();

    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    await prisma.userInfo.upsert({
      where: { userId: targetUserId },
      update: { role: UserRole.ADMIN },
      create: {
        userId: targetUserId,
        role: UserRole.ADMIN
      }
    });

    return true;
  } catch (error) {
    console.error("Error making user admin:", error);
    return false;
  }
}