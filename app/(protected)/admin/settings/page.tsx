"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Switch,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
} from "@nextui-org/react";
import {
  IconSettings,
  IconUser,
  IconShield,
  IconTrash,
  IconPlus,
  IconUserPlus,
} from "@tabler/icons-react";
import { useUser } from "@clerk/nextjs";

interface AdminUser {
  id: string;
  userId: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  createdAt: string;
}

export default function AdminSettings() {
  const { user } = useUser();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    requireApproval: false,
    autoAssignWorkouts: false,
    emailNotifications: true,
  });

  const { isOpen: isAddAdminOpen, onOpen: onAddAdminOpen, onClose: onAddAdminClose } = useDisclosure();

  useEffect(() => {
    fetchAdminUsers();
    fetchSettings();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      const response = await fetch("/api/admin/settings/admins");
      const data = await response.json();
      setAdminUsers(data.admins || []);
    } catch (error) {
      console.error("Error fetching admin users:", error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      const data = await response.json();
      setSettings(data.settings || settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const addAdmin = async () => {
    if (!newAdminEmail.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/admin/settings/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newAdminEmail }),
      });

      if (response.ok) {
        await fetchAdminUsers();
        setNewAdminEmail("");
        onAddAdminClose();
      }
    } catch (error) {
      console.error("Error adding admin:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeAdmin = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/settings/remove-admin/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchAdminUsers();
      }
    } catch (error) {
      console.error("Error removing admin:", error);
    }
  };

  const updateSettings = async (newSettings: typeof settings) => {
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
        setSettings(newSettings);
      }
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  const makeFirstAdmin = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const response = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error setting up admin:", error);
    } finally {
      setLoading(false);
    }
  };

  const isCurrentUserAdmin = adminUsers.some(admin => admin.userId === user?.id);

  if (!isCurrentUserAdmin && adminUsers.length === 0) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <h2 className="text-xl font-bold">Setup Admin Access</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-foreground-500">
              No admin users found. Make yourself the first admin to manage the system.
            </p>
            <Button
              color="primary"
              onPress={makeFirstAdmin}
              isLoading={loading}
              className="w-full"
            >
              Make Me Admin
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!isCurrentUserAdmin) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Card className="max-w-md">
          <CardBody className="text-center space-y-4">
            <IconShield size={48} className="mx-auto text-warning" />
            <h2 className="text-xl font-bold">Access Denied</h2>
            <p className="text-foreground-500">
              You don't have permission to access admin settings.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Settings</h1>
        <p className="text-foreground-500 mt-2">
          Configure system settings and manage admin users.
        </p>
      </div>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <IconSettings size={24} />
            <h3 className="text-lg font-semibold">System Settings</h3>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Require Assignment Approval</p>
              <p className="text-sm text-foreground-500">
                New workout assignments need admin approval before activation
              </p>
            </div>
            <Switch
              isSelected={settings.requireApproval}
              onValueChange={(value) =>
                updateSettings({ ...settings, requireApproval: value })
              }
            />
          </div>

          <Divider />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-Assign Workouts</p>
              <p className="text-sm text-foreground-500">
                Automatically assign beginner workouts to new users
              </p>
            </div>
            <Switch
              isSelected={settings.autoAssignWorkouts}
              onValueChange={(value) =>
                updateSettings({ ...settings, autoAssignWorkouts: value })
              }
            />
          </div>

          <Divider />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-foreground-500">
                Send email notifications for important events
              </p>
            </div>
            <Switch
              isSelected={settings.emailNotifications}
              onValueChange={(value) =>
                updateSettings({ ...settings, emailNotifications: value })
              }
            />
          </div>
        </CardBody>
      </Card>

      {/* Admin Users Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <IconUser size={24} />
              <h3 className="text-lg font-semibold">Admin Users</h3>
            </div>
            <Button
              color="primary"
              size="sm"
              startContent={<IconUserPlus size={16} />}
              onPress={onAddAdminOpen}
            >
              Add Admin
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {adminUsers.map((admin) => (
              <div
                key={admin.id}
                className="flex items-center justify-between p-4 bg-content2 rounded-lg"
              >
                <div>
                  <p className="font-medium">{admin.userId.slice(0, 8)}...</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Chip
                      size="sm"
                      variant="flat"
                      color={admin.role === "SUPER_ADMIN" ? "danger" : "warning"}
                    >
                      {admin.role}
                    </Chip>
                    <span className="text-xs text-foreground-500">
                      Added {new Date(admin.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {admin.userId === user?.id && (
                    <Chip size="sm" variant="flat" color="primary">
                      You
                    </Chip>
                  )}
                  {admin.userId !== user?.id && (
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      color="danger"
                      onClick={() => removeAdmin(admin.userId)}
                    >
                      <IconTrash size={16} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">System Information</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-foreground-500">Admin Users</p>
              <p className="font-medium">{adminUsers.length}</p>
            </div>
            <div>
              <p className="text-foreground-500">System Status</p>
              <Chip size="sm" color="success" variant="flat">
                Operational
              </Chip>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Add Admin Modal */}
      <Modal isOpen={isAddAdminOpen} onClose={onAddAdminClose}>
        <ModalContent>
          <ModalHeader>Add New Admin</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="User Email or ID"
                placeholder="Enter user email or Clerk user ID"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
              />
              <p className="text-sm text-foreground-500">
                Enter the email address or Clerk user ID of the user you want to make an admin.
                They must have an existing account.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onPress={onAddAdminClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={addAdmin}
              isLoading={loading}
              isDisabled={!newAdminEmail.trim()}
            >
              Add Admin
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}