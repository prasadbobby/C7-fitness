import { redirect } from "next/navigation";
import { checkAdminAuth } from "@/utils/adminAuth";
import PageHeading from "@/components/PageHeading/PageHeading";
import { InviteUserForm } from "./_components/InviteSuperAdminForm";
import { UserManagementList } from "./_components/SuperAdminList";
import { ExistingUsersManager } from "./_components/ExistingUsersManager";
import prisma from "@/prisma/prisma";
import { UserRole } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs";

export default async function AdminSettingsPage() {
  const { isAdmin, role, userId } = await checkAdminAuth();

  if (!isAdmin || !userId) {
    redirect("/");
  }

  // Both ADMIN and SUPER_ADMIN can access settings
  if (role !== UserRole.ADMIN && role !== UserRole.SUPER_ADMIN) {
    redirect("/admin/dashboard");
  }

  // Get all users with admin roles
  const adminUsersData = await prisma.userInfo.findMany({
    where: {
      role: {
        in: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
      }
    },
    select: {
      id: true,
      userId: true,
      role: true,
      createdAt: true
    },
    orderBy: {
      role: 'desc' // SUPER_ADMIN first, then ADMIN
    }
  });

  // Get Clerk user details for admin users
  const adminUserIds = adminUsersData.map(user => user.userId);
  const clerkAdminUsers = adminUserIds.length > 0 ? await clerkClient.users.getUserList({
    userId: adminUserIds
  }) : [];

  // Create a map of Clerk user data
  const clerkUserMap = new Map(clerkAdminUsers.map(user => [user.id, user]));

  // Combine database and Clerk data for admin users
  const adminUsers = adminUsersData.map(dbUser => {
    const clerkUser = clerkUserMap.get(dbUser.userId);
    return {
      id: dbUser.id,
      userId: dbUser.userId,
      role: dbUser.role,
      createdAt: dbUser.createdAt.toISOString(), // Serialize date
      name: clerkUser ? `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() : 'Unknown User',
      email: clerkUser?.emailAddresses?.[0]?.emailAddress || 'No email',
      imageUrl: clerkUser?.imageUrl || ''
    };
  });

  // Get all pending invitations
  const pendingInvitationsData = await prisma.pendingInvitation.findMany({
    select: {
      email: true,
      role: true,
      createdAt: true,
      invitationId: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Serialize pending invitations
  const pendingInvitations = pendingInvitationsData.map(invitation => ({
    ...invitation,
    createdAt: invitation.createdAt.toISOString() // Serialize date
  }));

  // Get regular users for role management (limit to 50 for performance)
  const regularUsersData = await prisma.userInfo.findMany({
    where: {
      role: UserRole.USER
    },
    select: {
      id: true,
      userId: true,
      role: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 50
  });

  // Get Clerk user details for regular users
  const regularUserIds = regularUsersData.map(user => user.userId);
  const clerkRegularUsers = regularUserIds.length > 0 ? await clerkClient.users.getUserList({
    userId: regularUserIds
  }) : [];

  // Create a map for regular users
  const clerkRegularUserMap = new Map(clerkRegularUsers.map(user => [user.id, user]));

  // Combine database and Clerk data for regular users
  const regularUsers = regularUsersData.map(dbUser => {
    const clerkUser = clerkRegularUserMap.get(dbUser.userId);
    return {
      id: dbUser.id,
      userId: dbUser.userId,
      role: dbUser.role,
      createdAt: dbUser.createdAt.toISOString(), // Serialize date
      name: clerkUser ? `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() : 'Unknown User',
      email: clerkUser?.emailAddresses?.[0]?.emailAddress || 'No email',
      imageUrl: clerkUser?.imageUrl || ''
    };
  });

  const currentUserRole = role as UserRole;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-content1/20">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            User Management Center
          </h1>
          <p className="text-foreground-500 text-lg max-w-2xl mx-auto">
            Manage user roles, send invitations, and oversee system access.
            {currentUserRole === UserRole.SUPER_ADMIN ? " You have full administrative privileges." : " You have administrative privileges."}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8">
          {/* Invite New Users */}
          <InviteUserForm />

          {/* User Management */}
          <UserManagementList
            adminUsers={adminUsers}
            regularUsers={regularUsers}
            currentUserId={userId}
            currentUserRole={currentUserRole}
            pendingInvitations={pendingInvitations}
          />

          {/* Existing Users Manager */}
          <ExistingUsersManager currentUserRole={currentUserRole} />
        </div>
      </div>
    </div>
  );
}