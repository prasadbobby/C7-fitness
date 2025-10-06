import { redirect } from "next/navigation";
import { checkAdminAuth } from "@/utils/adminAuth";
import { UserRole } from "@prisma/client";
import { Card, CardBody, CardHeader, Chip, Button } from "@nextui-org/react";
import { IconSettings, IconShield, IconDatabase, IconLock, IconMail, IconChartLine, IconServer } from "@tabler/icons-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const { isAdmin, role, userId } = await checkAdminAuth();

  if (!isAdmin || !userId) {
    redirect("/");
  }

  // Both ADMIN and SUPER_ADMIN can access settings
  if (role !== UserRole.ADMIN && role !== UserRole.SUPER_ADMIN) {
    redirect("/admin/dashboard");
  }

  const currentUserRole = role as UserRole;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-content1/20">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Admin Settings
          </h1>
          <p className="text-foreground-500 text-lg max-w-2xl mx-auto">
            System configuration and administrative controls.
            {currentUserRole === UserRole.SUPER_ADMIN ? " You have full administrative privileges." : " You have administrative privileges."}
          </p>
        </div>

        {/* Settings Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* User Management */}
          <Card className="border-2 border-primary/10 hover:border-primary/30 transition-colors">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-divider">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <IconShield size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">User Management</h3>
                  <p className="text-sm text-foreground-500">Manage users, roles, and invitations</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              <p className="text-sm text-foreground-600 mb-4">
                View, edit, invite, and manage all user accounts and their permissions.
              </p>
              <Button
                as={Link}
                href="/admin/users"
                color="primary"
                variant="flat"
                fullWidth
                endContent={<IconShield size={16} />}
              >
                Open User Management
              </Button>
            </CardBody>
          </Card>

          {/* System Configuration */}
          <Card className="border-2 border-warning/10 hover:border-warning/30 transition-colors">
            <CardHeader className="bg-gradient-to-r from-warning/5 to-orange-500/5 border-b border-divider">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <IconSettings size={24} className="text-warning" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">System Settings</h3>
                  <p className="text-sm text-foreground-500">Application configuration</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              <p className="text-sm text-foreground-600 mb-4">
                Configure application-wide settings, features, and preferences.
              </p>
              <Button
                color="warning"
                variant="flat"
                fullWidth
                endContent={<IconSettings size={16} />}
                isDisabled
              >
                Coming Soon
              </Button>
            </CardBody>
          </Card>

          {/* Database Management */}
          <Card className="border-2 border-secondary/10 hover:border-secondary/30 transition-colors">
            <CardHeader className="bg-gradient-to-r from-secondary/5 to-purple-500/5 border-b border-divider">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <IconDatabase size={24} className="text-secondary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Database</h3>
                  <p className="text-sm text-foreground-500">Data management and backups</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              <p className="text-sm text-foreground-600 mb-4">
                Monitor database health, manage backups, and view system statistics.
              </p>
              <Button
                color="secondary"
                variant="flat"
                fullWidth
                endContent={<IconDatabase size={16} />}
                isDisabled
              >
                Coming Soon
              </Button>
            </CardBody>
          </Card>

          {/* Security Settings */}
          <Card className="border-2 border-danger/10 hover:border-danger/30 transition-colors">
            <CardHeader className="bg-gradient-to-r from-danger/5 to-red-500/5 border-b border-divider">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-danger/10 rounded-lg">
                  <IconLock size={24} className="text-danger" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Security</h3>
                  <p className="text-sm text-foreground-500">Security and authentication</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              <p className="text-sm text-foreground-600 mb-4">
                Configure authentication settings, API keys, and security policies.
              </p>
              <Button
                color="danger"
                variant="flat"
                fullWidth
                endContent={<IconLock size={16} />}
                isDisabled
              >
                Coming Soon
              </Button>
            </CardBody>
          </Card>

          {/* Email Settings */}
          <Card className="border-2 border-success/10 hover:border-success/30 transition-colors">
            <CardHeader className="bg-gradient-to-r from-success/5 to-green-500/5 border-b border-divider">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <IconMail size={24} className="text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Email</h3>
                  <p className="text-sm text-foreground-500">Email notifications and templates</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              <p className="text-sm text-foreground-600 mb-4">
                Configure email templates, notification settings, and SMTP configuration.
              </p>
              <Button
                color="success"
                variant="flat"
                fullWidth
                endContent={<IconMail size={16} />}
                isDisabled
              >
                Coming Soon
              </Button>
            </CardBody>
          </Card>

          {/* Analytics */}
          <Card className="border-2 border-blue-500/10 hover:border-blue-500/30 transition-colors">
            <CardHeader className="bg-gradient-to-r from-blue-500/5 to-indigo-500/5 border-b border-divider">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <IconChartLine size={24} className="text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Analytics</h3>
                  <p className="text-sm text-foreground-500">Usage statistics and insights</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              <p className="text-sm text-foreground-600 mb-4">
                View detailed analytics, user engagement metrics, and system performance.
              </p>
              <Button
                className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                variant="flat"
                fullWidth
                endContent={<IconChartLine size={16} />}
                isDisabled
              >
                Coming Soon
              </Button>
            </CardBody>
          </Card>
        </div>

        {/* Admin Info */}
        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20">
          <CardBody className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <IconServer size={32} className="text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-2">Administrator Information</h3>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground-500">Your Role:</span>
                    <Chip color={currentUserRole === UserRole.SUPER_ADMIN ? "danger" : "warning"} variant="flat">
                      {currentUserRole.replace('_', ' ')}
                    </Chip>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground-500">Access Level:</span>
                    <span className="font-medium text-foreground">
                      {currentUserRole === UserRole.SUPER_ADMIN ? "Full System Access" : "Administrative Access"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}