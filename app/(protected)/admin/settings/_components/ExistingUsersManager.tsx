"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Button, Input, Select, SelectItem, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@nextui-org/react";
import { IconUserEdit, IconSearch, IconUserCheck, IconUserX, IconShield, IconSettings, IconUser } from "@tabler/icons-react";
import { UserRole } from "@prisma/client";
import { toast } from "sonner";
import { searchUsers, updateUserRole } from "../_actions";

interface ClerkUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: Array<{ emailAddress: string }>;
  imageUrl: string;
  currentRole?: UserRole;
}

interface ExistingUsersManagerProps {
  currentUserRole: UserRole;
}

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

export function ExistingUsersManager({ currentUserRole }: ExistingUsersManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<ClerkUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ClerkUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.USER);
  const [isUpdating, setIsUpdating] = useState(false);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchUsers(searchTerm);
      if (result.success) {
        setSearchResults(result.users || []);
        if (result.users?.length === 0) {
          toast.info("No users found");
        }
      } else {
        toast.error(result.error || "Failed to search users");
        setSearchResults([]);
      }
    } catch (error) {
      toast.error("Failed to search users");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const openRoleModal = (user: ClerkUser) => {
    setSelectedUser(user);
    setSelectedRole(user.currentRole || UserRole.USER);
    onOpen();
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    // Check permissions
    if (selectedRole === UserRole.SUPER_ADMIN && currentUserRole !== UserRole.SUPER_ADMIN) {
      toast.error("Only super admins can assign super admin role");
      return;
    }

    if (selectedRole === UserRole.ADMIN && currentUserRole !== UserRole.SUPER_ADMIN) {
      toast.error("Only super admins can assign admin role");
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updateUserRole(selectedUser.id, selectedRole);
      if (result.success) {
        toast.success(`User role updated to ${selectedRole.toLowerCase()}`);

        // Update the search results to reflect the change
        setSearchResults(prev =>
          prev.map(user =>
            user.id === selectedUser.id
              ? { ...user, currentRole: selectedRole }
              : user
          )
        );
        onOpenChange();
      } else {
        toast.error(result.error || "Failed to update user role");
      }
    } catch (error) {
      toast.error("Failed to update user role");
    } finally {
      setIsUpdating(false);
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

  return (
    <>
      <Card className="border-2 border-content2">
        <CardHeader className="bg-gradient-to-r from-secondary/5 to-primary/5 border-b border-divider">
          <div className="flex items-center gap-4 w-full">
            <div className="p-3 bg-secondary/10 rounded-xl">
              <IconUserEdit size={28} className="text-secondary" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground">Manage Existing Users</h3>
              <p className="text-sm text-foreground-500 mt-1">
                Search for existing users and modify their roles
              </p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-6">
          {/* Search Section */}
          <div className="flex gap-3 mb-6">
            <Input
              placeholder="Search by name, email, or user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              startContent={<IconSearch size={20} className="text-foreground-400" />}
              variant="bordered"
              classNames={{
                input: "text-foreground",
                inputWrapper: "border-2 hover:border-primary/50 focus-within:border-primary"
              }}
              size="lg"
            />
            <Button
              color="primary"
              size="lg"
              onClick={handleSearch}
              isLoading={isSearching}
              startContent={!isSearching && <IconSearch size={20} />}
              className="px-8 font-semibold"
            >
              Search
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground mb-4">
                Search Results ({searchResults.length})
              </h4>
              <div className="space-y-3">
                {searchResults.map((user) => {
                  const RoleIcon = getRoleIcon(user.currentRole || UserRole.USER);
                  const roleColor = getRoleColor(user.currentRole || UserRole.USER);

                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-content1 border border-divider rounded-xl shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={user.imageUrl}
                          alt="User"
                          className="w-12 h-12 rounded-full border-2 border-divider"
                        />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-foreground">
                              {user.firstName} {user.lastName}
                            </p>
                          </div>
                          <p className="text-sm text-foreground-500">
                            {user.emailAddresses[0]?.emailAddress}
                          </p>
                          <p className="text-xs text-foreground-400">
                            ID: {user.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <RoleIcon size={16} />
                          <Chip size="sm" color={roleColor} variant="flat" className="font-medium">
                            {(user.currentRole || UserRole.USER).replace('_', ' ')}
                          </Chip>
                        </div>
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat"
                          startContent={<IconUserEdit size={16} />}
                          onClick={() => openRoleModal(user)}
                        >
                          Edit Role
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isSearching && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-foreground-500 mt-4">Searching users...</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Role Update Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-lg font-bold">Update User Role</h3>
                <p className="text-sm text-foreground-500">
                  Change role for {selectedUser?.firstName} {selectedUser?.lastName}
                </p>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <div className="p-3 bg-content2 rounded-lg">
                    <p className="text-sm text-foreground-500 mb-1">User Email</p>
                    <p className="font-medium">{selectedUser?.emailAddresses[0]?.emailAddress}</p>
                  </div>

                  <div className="p-3 bg-content2 rounded-lg">
                    <p className="text-sm text-foreground-500 mb-1">Current Role</p>
                    <Chip
                      size="sm"
                      color={getRoleColor(selectedUser?.currentRole || UserRole.USER)}
                      variant="flat"
                    >
                      {(selectedUser?.currentRole || UserRole.USER).replace('_', ' ')}
                    </Chip>
                  </div>

                  <Select
                    label="New Role"
                    placeholder="Select new role"
                    selectedKeys={[selectedRole]}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as UserRole;
                      setSelectedRole(selected);
                    }}
                    variant="bordered"
                  >
                    {roleOptions.map((role) => {
                      const Icon = role.icon;
                      const isDisabled = (role.value === UserRole.SUPER_ADMIN || role.value === UserRole.ADMIN)
                        && currentUserRole !== UserRole.SUPER_ADMIN;

                      return (
                        <SelectItem
                          key={role.value}
                          value={role.value}
                          startContent={<Icon size={18} />}
                          isDisabled={isDisabled}
                          description={isDisabled ? "Insufficient permissions" : role.description}
                        >
                          {role.label}
                        </SelectItem>
                      );
                    })}
                  </Select>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={handleUpdateRole}
                  isLoading={isUpdating}
                  startContent={!isUpdating && <IconUserCheck size={18} />}
                >
                  Update Role
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}