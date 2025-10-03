"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, Button, Input, Select, SelectItem, Chip } from "@nextui-org/react";
import { IconUserPlus, IconMail, IconShield, IconUser, IconSettings } from "@tabler/icons-react";
import { inviteUser } from "../_actions";
import { toast } from "sonner";
import { UserRole } from "@prisma/client";

const roleOptions = [
  {
    value: UserRole.USER,
    label: "User",
    description: "Standard user access",
    icon: IconUser,
    color: "default" as const,
  },
  {
    value: UserRole.ADMIN,
    label: "Admin",
    description: "Administrative privileges",
    icon: IconSettings,
    color: "warning" as const,
  },
  {
    value: UserRole.SUPER_ADMIN,
    label: "Super Admin",
    description: "Full system access",
    icon: IconShield,
    color: "danger" as const,
  },
];

export function InviteUserForm() {
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.USER);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsLoading(true);
    try {
      const result = await inviteUser(email.trim(), selectedRole);

      if (result.success) {
        toast.success(`${roleOptions.find(r => r.value === selectedRole)?.label} invitation sent successfully!`);
        setEmail("");
        setSelectedRole(UserRole.USER);
      } else {
        toast.error(result.error || "Failed to send invitation");
      }
    } catch (error) {
      toast.error("Failed to send invitation");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRoleOption = roleOptions.find(r => r.value === selectedRole);

  return (
    <Card className="border-2 border-primary/10">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-divider">
        <div className="flex items-center gap-4 w-full">
          <div className="p-3 bg-primary/10 rounded-xl">
            <IconUserPlus size={28} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground">Invite New User</h3>
            <p className="text-sm text-foreground-500 mt-1">
              Send invitation emails to create new accounts with specific roles
            </p>
          </div>
        </div>
      </CardHeader>
      <CardBody className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              type="email"
              label="Email Address"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              startContent={<IconMail size={20} className="text-foreground-400" />}
              variant="bordered"
              classNames={{
                input: "text-foreground",
                inputWrapper: "border-2 hover:border-primary/50 focus-within:border-primary"
              }}
              isRequired
            />

            <Select
              label="User Role"
              placeholder="Select role"
              selectedKeys={[selectedRole]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as UserRole;
                setSelectedRole(selected);
              }}
              variant="bordered"
              classNames={{
                trigger: "border-2 hover:border-primary/50 data-[focus=true]:border-primary"
              }}
              renderValue={() => {
                if (selectedRoleOption) {
                  const Icon = selectedRoleOption.icon;
                  return (
                    <div className="flex items-center gap-2">
                      <Icon size={18} />
                      <span>{selectedRoleOption.label}</span>
                    </div>
                  );
                }
                return null;
              }}
            >
              {roleOptions.map((role) => {
                const Icon = role.icon;
                return (
                  <SelectItem
                    key={role.value}
                    value={role.value}
                    startContent={<Icon size={18} />}
                    endContent={<Chip size="sm" color={role.color} variant="flat">{role.label}</Chip>}
                  >
                    <div>
                      <div className="font-medium">{role.label}</div>
                      <div className="text-sm text-foreground-500">{role.description}</div>
                    </div>
                  </SelectItem>
                );
              })}
            </Select>
          </div>

          {selectedRoleOption && (
            <div className="p-4 bg-content2 rounded-lg border border-divider">
              <div className="flex items-center gap-3 mb-2">
                <selectedRoleOption.icon size={20} className="text-foreground-600" />
                <span className="font-medium text-foreground">Selected Role: {selectedRoleOption.label}</span>
                <Chip size="sm" color={selectedRoleOption.color} variant="flat">
                  {selectedRoleOption.label}
                </Chip>
              </div>
              <p className="text-sm text-foreground-500">{selectedRoleOption.description}</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              color="primary"
              size="lg"
              isLoading={isLoading}
              startContent={!isLoading && <IconUserPlus size={20} />}
              className="font-semibold"
            >
              {isLoading ? "Sending Invitation..." : `Send ${selectedRoleOption?.label} Invitation`}
            </Button>

            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-warning-foreground">
                <strong>Note:</strong> The recipient will receive an email invitation from Clerk.
                Once they create their account, they will automatically be assigned the {selectedRoleOption?.label.toLowerCase()} role.
              </p>
            </div>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}