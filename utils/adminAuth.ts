import { auth, currentUser } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";
import { UserRole } from "@prisma/client";

export async function checkAdminAuth(): Promise<{ isAdmin: boolean; userId: string | null; role: UserRole | null }> {
  try {
    const { userId } = auth();

    if (!userId) {
      return { isAdmin: false, userId: null, role: null };
    }

    // Get user details from Clerk to check email and metadata
    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;

    // Check if user exists in our database and get their role
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId },
      select: { role: true }
    });

    if (!userInfo) {
      let initialRole: UserRole = UserRole.USER;

      // Check if this is the hardcoded super admin email
      if (userEmail === "knvdurgaprasad610@gmail.com") {
        initialRole = UserRole.SUPER_ADMIN;
      } else if (userEmail) {
        // Check if there's a pending invitation for this email
        const pendingInvitation = await prisma.pendingInvitation.findUnique({
          where: { email: userEmail },
          select: { role: true }
        });

        if (pendingInvitation) {
          initialRole = pendingInvitation.role;

          // Clean up the pending invitation
          await prisma.pendingInvitation.delete({
            where: { email: userEmail }
          });
        }
      }

      // Create user with appropriate role
      await prisma.userInfo.create({
        data: {
          userId,
          role: initialRole
        }
      });

      const isAdmin = initialRole === UserRole.ADMIN || initialRole === UserRole.SUPER_ADMIN;
      return { isAdmin, userId, role: initialRole };
    }

    // Check if existing user is the hardcoded super admin but doesn't have SUPER_ADMIN role
    if (userEmail === "knvdurgaprasad610@gmail.com" && userInfo.role !== UserRole.SUPER_ADMIN) {
      await prisma.userInfo.update({
        where: { userId },
        data: { role: UserRole.SUPER_ADMIN }
      });
      return { isAdmin: true, userId, role: UserRole.SUPER_ADMIN };
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

export async function makeUserAdmin(targetUserId: string): Promise<boolean> {
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