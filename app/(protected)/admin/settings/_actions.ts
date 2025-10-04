"use server";

import { checkAdminAuth } from "@/utils/adminAuth";
import { clerkClient } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function inviteUser(email: string, targetRole: UserRole = UserRole.USER) {
  try {
    // Check if current user is admin
    const { isAdmin, role: currentUserRole } = await checkAdminAuth();

    if (!isAdmin) {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // Only SUPER_ADMIN can invite other SUPER_ADMINs
    if (targetRole === UserRole.SUPER_ADMIN && currentUserRole !== UserRole.SUPER_ADMIN) {
      return { success: false, error: "Unauthorized: Only super admins can invite other super admins" };
    }

    // Only SUPER_ADMIN can invite ADMINs
    if (targetRole === UserRole.ADMIN && currentUserRole !== UserRole.SUPER_ADMIN) {
      return { success: false, error: "Unauthorized: Only super admins can invite admins" };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: "Invalid email format" };
    }

    // Check if user already exists with this email
    const existingUsers = await clerkClient.users.getUserList({
      emailAddress: [email]
    });

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];

      // Check if user is already an admin
      const userInfo = await prisma.userInfo.findUnique({
        where: { userId: existingUser.id },
        select: { role: true }
      });

      if (userInfo?.role === targetRole) {
        return { success: false, error: `User already has ${targetRole.toLowerCase()} role` };
      }

      // Update existing user role
      await prisma.userInfo.upsert({
        where: { userId: existingUser.id },
        update: { role: targetRole },
        create: {
          userId: existingUser.id,
          role: targetRole
        }
      });

      revalidatePath("/admin/settings");
      return { success: true, message: `Existing user role updated to ${targetRole.toLowerCase()}` };
    }

    // Check if invitation already exists for this email
    const existingInvitation = await prisma.pendingInvitation.findUnique({
      where: { email }
    });

    if (existingInvitation) {
      return { success: false, error: "An invitation has already been sent to this email address" };
    }

    // Create invitation for new user
    try {
      const invitation = await clerkClient.invitations.createInvitation({
        emailAddress: email,
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://c7pfs.site'}${process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL}?role=${targetRole.toLowerCase()}`,
        publicMetadata: {
          role: targetRole.toLowerCase(),
          invitedBy: currentUserRole?.toLowerCase() || "admin"
        }
      });

      // Store the invited email in a temporary table for tracking
      await prisma.pendingInvitation.create({
        data: {
          email,
          role: targetRole,
          invitationId: invitation.id
        }
      });

      revalidatePath("/admin/settings");
      return { success: true, message: "Invitation sent successfully" };

    } catch (clerkError: any) {
      // Handle Clerk-specific errors
      if (clerkError?.errors?.[0]?.code === 'duplicate_record') {
        return { success: false, error: "An invitation has already been sent to this email address" };
      }

      // Log the full error for debugging
      console.error("Clerk invitation error:", clerkError);
      throw clerkError; // Re-throw to be caught by outer try-catch
    }

  } catch (error) {
    console.error("Error inviting super admin:", error);
    return { success: false, error: "Failed to send invitation" };
  }
}

export async function removeSuperAdmin(userId: string) {
  try {
    // Check if current user is super admin
    const { isAdmin, role, userId: currentUserId } = await checkAdminAuth();

    if (!isAdmin || role !== UserRole.SUPER_ADMIN) {
      return { success: false, error: "Unauthorized: Only super admins can remove other super admins" };
    }

    // Prevent self-removal
    if (userId === currentUserId) {
      return { success: false, error: "Cannot remove yourself" };
    }

    // Remove super admin role
    await prisma.userInfo.update({
      where: { userId },
      data: { role: UserRole.USER }
    });

    revalidatePath("/admin/settings");
    return { success: true, message: "Super admin removed successfully" };

  } catch (error) {
    console.error("Error removing super admin:", error);
    return { success: false, error: "Failed to remove super admin" };
  }
}

export async function cancelInvitation(email: string) {
  try {
    // Check if current user is admin
    const { isAdmin } = await checkAdminAuth();

    if (!isAdmin) {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // Find and remove the pending invitation
    const pendingInvitation = await prisma.pendingInvitation.findUnique({
      where: { email }
    });

    if (!pendingInvitation) {
      return { success: false, error: "No pending invitation found for this email" };
    }

    // Try to revoke the Clerk invitation if we have the ID
    if (pendingInvitation.invitationId) {
      try {
        await clerkClient.invitations.revokeInvitation(pendingInvitation.invitationId);
      } catch (clerkError) {
        console.warn("Could not revoke Clerk invitation:", clerkError);
        // Continue anyway to clean up our database
      }
    }

    // Remove from our database
    await prisma.pendingInvitation.delete({
      where: { email }
    });

    revalidatePath("/admin/settings");
    return { success: true, message: "Invitation cancelled successfully" };

  } catch (error) {
    console.error("Error cancelling invitation:", error);
    return { success: false, error: "Failed to cancel invitation" };
  }
}

export async function searchUsers(searchTerm: string) {
  try {
    // Check if current user is admin
    const { isAdmin } = await checkAdminAuth();

    if (!isAdmin) {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    if (!searchTerm.trim()) {
      return { success: false, error: "Please enter a search term" };
    }

    // Search users in Clerk - try different search methods
    let clerkUsers: any[] = [];

    try {
      // First try email search if it looks like an email
      if (searchTerm.includes('@')) {
        clerkUsers = await clerkClient.users.getUserList({
          emailAddress: [searchTerm],
          limit: 20
        });
      } else {
        // Otherwise search by query
        clerkUsers = await clerkClient.users.getUserList({
          query: searchTerm,
          limit: 20
        });
      }
    } catch (clerkError) {
      console.error("Clerk search error:", clerkError);
      // Try a broader search if specific search fails
      try {
        clerkUsers = await clerkClient.users.getUserList({
          limit: 100 // Get more users and filter on frontend
        });

        // Filter users on our end
        const lowerSearchTerm = searchTerm.toLowerCase();
        clerkUsers = clerkUsers.filter(user => {
          const firstName = (user.firstName || '').toLowerCase();
          const lastName = (user.lastName || '').toLowerCase();
          const email = user.emailAddresses?.[0]?.emailAddress?.toLowerCase() || '';
          const userId = user.id.toLowerCase();

          return firstName.includes(lowerSearchTerm) ||
                 lastName.includes(lowerSearchTerm) ||
                 email.includes(lowerSearchTerm) ||
                 userId.includes(lowerSearchTerm);
        }).slice(0, 20); // Limit to 20 results
      } catch (fallbackError) {
        console.error("Fallback search also failed:", fallbackError);
        return { success: false, error: "Unable to search users. Please try again." };
      }
    }

    if (!clerkUsers || clerkUsers.length === 0) {
      return { success: true, users: [], message: "No users found matching your search" };
    }

    // Get user roles from our database
    const userIds = clerkUsers.map(user => user.id);
    const userRoles = await prisma.userInfo.findMany({
      where: {
        userId: {
          in: userIds
        }
      },
      select: {
        userId: true,
        role: true
      }
    });

    const roleMap = new Map(userRoles.map(user => [user.userId, user.role]));

    const users = clerkUsers.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      emailAddresses: user.emailAddresses,
      imageUrl: user.imageUrl,
      currentRole: roleMap.get(user.id) || UserRole.USER
    }));

    return { success: true, users };

  } catch (error) {
    console.error("Error searching users:", error);
    return { success: false, error: "Failed to search users. Please try again." };
  }
}

export async function updateUserRole(userId: string, newRole: UserRole) {
  try {
    // Check if current user is admin
    const { isAdmin, role: currentUserRole } = await checkAdminAuth();

    if (!isAdmin) {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // Only SUPER_ADMIN can assign SUPER_ADMIN or ADMIN roles
    if ((newRole === UserRole.SUPER_ADMIN || newRole === UserRole.ADMIN) && currentUserRole !== UserRole.SUPER_ADMIN) {
      return { success: false, error: "Unauthorized: Only super admins can assign admin roles" };
    }

    // Update user role in database
    await prisma.userInfo.upsert({
      where: { userId },
      update: { role: newRole },
      create: {
        userId,
        role: newRole
      }
    });

    revalidatePath("/admin/settings");
    return { success: true, message: `User role updated to ${newRole.toLowerCase()}` };

  } catch (error) {
    console.error("Error updating user role:", error);
    return { success: false, error: "Failed to update user role" };
  }
}