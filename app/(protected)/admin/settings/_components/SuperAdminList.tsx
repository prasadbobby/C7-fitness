"use client";

import { Card, CardBody, CardHeader, Chip, Button, Divider, Tabs, Tab } from "@nextui-org/react";
import { IconUsers, IconUserMinus, IconShield, IconMail, IconX, IconClock, IconUser, IconSettings, IconUserCheck, IconArrowDown } from "@tabler/icons-react";
import { UserRole } from "@prisma/client";
import { cancelInvitation, updateUserRole } from "../_actions";
import { toast } from "sonner";
import { useState } from "react";

interface User {
  id: string;
  userId: string;
  role: UserRole;
  createdAt: string; // Now serialized as string
  name: string;
  email: string;
  imageUrl: string;
}

interface PendingInvitation {
  email: string;
  role: UserRole;
  createdAt: string; // Now serialized as string
  invitationId: string | null;
}

interface UserManagementListProps {
  adminUsers: User[];
  regularUsers: User[];
  currentUserId: string;
  currentUserRole: UserRole;
  pendingInvitations: PendingInvitation[];
}

const getRoleIcon = (role: UserRole) => {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return IconShield;
    case UserRole.ADMIN:
      return IconSettings;
    case UserRole.USER:
      return IconUser;
    default:
      return IconUser;
  }
};

const getRoleColor = (role: UserRole) => {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return "danger" as const;
    case UserRole.ADMIN:
      return "warning" as const;
    case UserRole.USER:
      return "default" as const;
    default:
      return "default" as const;
  }
};

export function UserManagementList({
  adminUsers,
  regularUsers,
  currentUserId,
  currentUserRole,
  pendingInvitations
}: UserManagementListProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const handleCancelInvitation = async (email: string) => {
    setIsLoading(email);
    try {
      const result = await cancelInvitation(email);
      if (result.success) {
        toast.success("Invitation cancelled successfully");
      } else {
        toast.error(result.error || "Failed to cancel invitation");
      }
    } catch (error) {
      toast.error("Failed to cancel invitation");
    } finally {
      setIsLoading(null);
    }
  };

  const handleDemoteUser = async (userId: string, currentRole: UserRole) => {
    let newRole: UserRole;
    let actionText: string;

    // Determine new role based on current role
    if (currentRole === UserRole.SUPER_ADMIN) {
      newRole = UserRole.ADMIN;
      actionText = "demoted to Admin";
    } else if (currentRole === UserRole.ADMIN) {
      newRole = UserRole.USER;
      actionText = "demoted to User";
    } else {
      toast.error("Cannot demote a regular user further");
      return;
    }

    setIsUpdatingRole(userId);
    try {
      const result = await updateUserRole(userId, newRole);
      if (result.success) {
        toast.success(`User ${actionText} successfully`);
        // Refresh the page to update the UI
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to update user role");
      }
    } catch (error) {
      toast.error("Failed to update user role");
    } finally {
      setIsUpdatingRole(null);
    }
  };

  const renderUserCard = (user: User, showActions = true) => {
    const RoleIcon = getRoleIcon(user.role);
    const roleColor = getRoleColor(user.role);

    return (
      <div
        key={user.id}
        className="flex items-center justify-between p-4 bg-content1 border border-divider rounded-xl shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-4">
          {user.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={user.name}
              className="w-12 h-12 rounded-full border-2 border-divider"
            />
          ) : (
            <div className={`p-3 rounded-full ${
              user.role === UserRole.SUPER_ADMIN ? 'bg-danger/10' :
              user.role === UserRole.ADMIN ? 'bg-warning/10' : 'bg-default/10'
            }`}>
              <RoleIcon size={20} className={
                user.role === UserRole.SUPER_ADMIN ? 'text-danger' :
                user.role === UserRole.ADMIN ? 'text-warning' : 'text-default-500'
              } />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-foreground">
                {user.name || 'Unknown User'}
              </p>
              {user.userId === currentUserId && (
                <Chip size="sm" color="primary" variant="flat">
                  You
                </Chip>
              )}
            </div>
            <p className="text-sm text-foreground-500">
              {user.email}
            </p>
            <p className="text-xs text-foreground-400">
              Joined {formatDate(user.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Chip size="sm" color={roleColor} variant="flat" className="font-medium">
            {user.role.replace('_', ' ')}
          </Chip>
          {showActions && user.userId !== currentUserId && currentUserRole === UserRole.SUPER_ADMIN && user.role !== UserRole.USER && (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="warning"
              onClick={() => handleDemoteUser(user.userId, user.role)}
              isLoading={isUpdatingRole === user.userId}
              className="opacity-60 hover:opacity-100"
              title={user.role === UserRole.SUPER_ADMIN ? "Demote to Admin" : "Demote to User"}
            >
              <IconArrowDown size={16} />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderInvitationCard = (invitation: PendingInvitation) => {
    const RoleIcon = getRoleIcon(invitation.role);
    const roleColor = getRoleColor(invitation.role);

    return (
      <div
        key={invitation.email}
        className="flex items-center justify-between p-4 bg-content1 border border-divider rounded-xl shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <IconMail size={20} className="text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{invitation.email}</p>
            <p className="text-sm text-foreground-500">
              Invited {formatDate(invitation.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Chip size="sm" color={roleColor} variant="flat">
            {invitation.role.replace('_', ' ')} PENDING
          </Chip>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            color="danger"
            onClick={() => handleCancelInvitation(invitation.email)}
            isLoading={isLoading === invitation.email}
            className="opacity-60 hover:opacity-100"
          >
            <IconX size={16} />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="border-2 border-content2">
      <CardHeader className="bg-gradient-to-r from-content1 to-content2 border-b border-divider">
        <div className="flex items-center gap-4 w-full">
          <div className="p-3 bg-success/10 rounded-xl">
            <IconUserCheck size={28} className="text-success" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground">User Management</h3>
            <p className="text-sm text-foreground-500 mt-1">
              Manage existing users and view pending invitations
            </p>
          </div>
        </div>
      </CardHeader>
      <CardBody className="p-6">
        <Tabs
          variant="underlined"
          classNames={{
            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
            cursor: "w-full bg-primary",
            tab: "max-w-fit px-0 h-12",
            tabContent: "group-data-[selected=true]:text-primary"
          }}
        >
          <Tab
            key="admins"
            title={
              <div className="flex items-center gap-2">
                <IconShield size={18} />
                <span>Administrators ({adminUsers.length})</span>
              </div>
            }
          >
            <div className="space-y-4 mt-6">
              {adminUsers.length === 0 ? (
                <div className="text-center py-12">
                  <IconShield size={48} className="mx-auto text-foreground-300 mb-4" />
                  <p className="text-foreground-500">No administrators found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {adminUsers.map((admin) => renderUserCard(admin))}
                </div>
              )}
            </div>
          </Tab>

          <Tab
            key="users"
            title={
              <div className="flex items-center gap-2">
                <IconUsers size={18} />
                <span>Regular Users ({regularUsers.length})</span>
              </div>
            }
          >
            <div className="space-y-4 mt-6">
              {regularUsers.length === 0 ? (
                <div className="text-center py-12">
                  <IconUser size={48} className="mx-auto text-foreground-300 mb-4" />
                  <p className="text-foreground-500">No regular users found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {regularUsers.map((user) => renderUserCard(user, false))}
                </div>
              )}
            </div>
          </Tab>

          <Tab
            key="pending"
            title={
              <div className="flex items-center gap-2">
                <IconClock size={18} />
                <span>Pending Invitations ({pendingInvitations.length})</span>
              </div>
            }
          >
            <div className="space-y-4 mt-6">
              {pendingInvitations.length === 0 ? (
                <div className="text-center py-12">
                  <IconMail size={48} className="mx-auto text-foreground-300 mb-4" />
                  <p className="text-foreground-500">No pending invitations</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingInvitations.map((invitation) => renderInvitationCard(invitation))}
                </div>
              )}
            </div>
          </Tab>
        </Tabs>
      </CardBody>
    </Card>
  );
}