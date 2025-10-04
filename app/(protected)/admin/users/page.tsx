"use client";

import { useState, useEffect } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import AdminPagination from "@/components/Admin/AdminPagination";
import AdminPerPageSelector from "@/components/Admin/AdminPerPageSelector";
import AdminModal from "@/components/Admin/AdminModal";
import BottomSheet from "@/components/UI/BottomSheet";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  useDisclosure,
  Card,
  CardBody,
  CardHeader,
  Pagination,
  Avatar,
  Tabs,
  Tab,
  Divider,
} from "@nextui-org/react";
import {
  IconEdit,
  IconTrash,
  IconPlus,
  IconSearch,
  IconBarbell,
  IconUser,
  IconChartLine,
  IconArrowDown,
  IconUserPlus,
  IconMail,
  IconX,
  IconClock,
  IconShield,
  IconSettings,
  IconUserCheck,
} from "@tabler/icons-react";
import { InviteUserForm } from "./_components/InviteUserForm";
import { cancelInvitation, updateUserRole } from "../settings/_actions";

interface User {
  id: string;
  userId: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  age?: number;
  height?: number;
  weight?: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    assignedWorkouts: number;
  };
  // Clerk data
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  imageUrl: string;
  name: string;
}

interface PendingInvitation {
  email: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  createdAt: string;
  invitationId: string | null;
}

export default function UserManagement() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [regularUsers, setRegularUsers] = useState<User[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState("all");
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);

  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isInviteOpen, onOpen: onInviteOpen, onClose: onInviteClose } = useDisclosure();

  // Get values from URL parameters
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const searchTerm = searchParams.get("search") || "";
  const selectedRole = searchParams.get("role") || "all";

  const itemsPerPage = limit;

  useEffect(() => {
    fetchUsers();
  }, [page, searchTerm, selectedRole]);

  const updateURLParams = (updates: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });
    replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSearchChange = (value: string) => {
    updateURLParams({ search: value, page: 1 });
  };

  const handleRoleChange = (role: string) => {
    updateURLParams({ role, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    updateURLParams({ page: newPage });
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        role: selectedRole,
      });

      const response = await fetch(`/api/admin/users/management?${params}`);
      const data = await response.json();

      setUsers(data.users);
      setAdminUsers(data.adminUsers);
      setRegularUsers(data.regularUsers);
      setPendingInvitations(data.pendingInvitations);
      setTotal(data.total);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    onEditOpen();
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    onDeleteOpen();
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/by-id/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        await fetchUsers();
        onEditClose();
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const deleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/by-id/${selectedUser.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchUsers();
        onDeleteClose();
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleCancelInvitation = async (email: string) => {
    setIsLoading(email);
    try {
      const result = await cancelInvitation(email);
      if (result.success) {
        await fetchUsers(); // Refresh data
      } else {
        console.error(result.error || "Failed to cancel invitation");
      }
    } catch (error) {
      console.error("Failed to cancel invitation");
    } finally {
      setIsLoading(null);
    }
  };

  const handleDemoteUser = async (userId: string, currentRole: "USER" | "ADMIN" | "SUPER_ADMIN") => {
    let newRole: "USER" | "ADMIN" | "SUPER_ADMIN";

    // Determine new role based on current role
    if (currentRole === "SUPER_ADMIN") {
      newRole = "ADMIN";
    } else if (currentRole === "ADMIN") {
      newRole = "USER";
    } else {
      console.error("Cannot demote a regular user further");
      return;
    }

    setIsUpdatingRole(userId);
    try {
      const result = await updateUserRole(userId, newRole as any);
      if (result.success) {
        await fetchUsers(); // Refresh data
      } else {
        console.error(result.error || "Failed to update user role");
      }
    } catch (error) {
      console.error("Failed to update user role");
    } finally {
      setIsUpdatingRole(null);
    }
  };

  const handleInviteSuccess = async () => {
    onInviteClose();
    await fetchUsers(); // Refresh data to show new pending invitation
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "danger";
      case "ADMIN":
        return "warning";
      default:
        return "primary";
    }
  };

  const getRoleIcon = (role: "USER" | "ADMIN" | "SUPER_ADMIN") => {
    switch (role) {
      case "SUPER_ADMIN":
        return IconShield;
      case "ADMIN":
        return IconSettings;
      case "USER":
        return IconUser;
      default:
        return IconUser;
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-foreground-500 mt-2">
            Manage user accounts, roles, permissions, and send invitations.
          </p>
        </div>
        <Button
          color="primary"
          startContent={<IconUserPlus size={18} />}
          className="font-medium"
          onPress={onInviteOpen}
        >
          Invite User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <IconUser size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm text-foreground-500">Total Users</p>
                <p className="text-xl font-bold text-foreground">{total}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <IconUser size={20} className="text-warning" />
              </div>
              <div>
                <p className="text-sm text-foreground-500">Admin Users</p>
                <p className="text-xl font-bold text-foreground">
                  {users.filter(u => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <IconMail size={20} className="text-secondary" />
              </div>
              <div>
                <p className="text-sm text-foreground-500">Pending Invitations</p>
                <p className="text-xl font-bold text-foreground">
                  {pendingInvitations.length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search users..."
                startContent={<IconSearch size={20} />}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                placeholder="Filter by role"
                selectedKeys={selectedRole ? [selectedRole] : []}
                onSelectionChange={(keys) => handleRoleChange(Array.from(keys)[0] as string)}
              >
                <SelectItem key="all">All Roles</SelectItem>
                <SelectItem key="USER">User</SelectItem>
                <SelectItem key="ADMIN">Admin</SelectItem>
                <SelectItem key="SUPER_ADMIN">Super Admin</SelectItem>
              </Select>
            </div>
            <div className="w-24">
              <AdminPerPageSelector />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Users and Invitations Tabs */}
      <Card>
        <CardBody className="p-0">
          <Tabs
            selectedKey={currentTab}
            onSelectionChange={(key) => setCurrentTab(key.toString())}
            variant="underlined"
            classNames={{
              tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider px-6",
              cursor: "w-full bg-primary",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-primary"
            }}
          >
            <Tab
              key="all"
              title={
                <div className="flex items-center gap-2">
                  <IconUser size={18} />
                  <span>All Users ({users.length})</span>
                </div>
              }
            >
              <div className="p-0">
                <Table aria-label="All users table">
                  <TableHeader>
                    <TableColumn>USER</TableColumn>
                    <TableColumn>ROLE</TableColumn>
                    <TableColumn>PHYSICAL INFO</TableColumn>
                    <TableColumn>WORKOUTS</TableColumn>
                    <TableColumn>JOINED</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="No users found" isLoading={loading}>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={user.imageUrl}
                              name={user.name ? user.name.charAt(0).toUpperCase() : "U"}
                              size="sm"
                              color="primary"
                              showFallback
                            />
                            <div>
                              <div className="font-medium text-sm">
                                {user.name || "Unknown User"}
                              </div>
                              <div className="text-xs text-foreground-500">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Chip color={getRoleColor(user.role)} variant="flat" size="sm">
                              {user.role}
                            </Chip>
                            {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="warning"
                                onClick={() => handleDemoteUser(user.userId, user.role)}
                                isLoading={isUpdatingRole === user.userId}
                                className="opacity-60 hover:opacity-100"
                                title={user.role === "SUPER_ADMIN" ? "Demote to Admin" : "Demote to User"}
                              >
                                <IconArrowDown size={16} />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {user.age && <span>Age: {user.age}</span>}
                            {user.height && <span className="ml-2">Height: {user.height}cm</span>}
                            {user.weight && <span className="ml-2">Weight: {user.weight}kg</span>}
                            {!user.age && !user.height && !user.weight && (
                              <span className="text-foreground-400">Not provided</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <IconBarbell size={16} />
                            <span>{user._count.assignedWorkouts}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(user.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="ghost"
                              color="primary"
                              as={Link}
                              href={`/admin/users/${user.id}/progress`}
                              title="View Progress"
                            >
                              <IconChartLine size={16} />
                            </Button>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="ghost"
                              onPress={() => handleEditUser(user)}
                              title="Edit User"
                            >
                              <IconEdit size={16} />
                            </Button>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="ghost"
                              color="danger"
                              onPress={() => handleDeleteUser(user)}
                              title="Delete User"
                            >
                              <IconTrash size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Tab>

            <Tab
              key="admins"
              title={
                <div className="flex items-center gap-2">
                  <IconShield size={18} />
                  <span>Administrators ({adminUsers.length})</span>
                </div>
              }
            >
              <div className="p-6">
                {adminUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <IconShield size={48} className="mx-auto text-foreground-300 mb-4" />
                    <p className="text-foreground-500">No administrators found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {adminUsers.map((admin) => {
                      const RoleIcon = getRoleIcon(admin.role);
                      return (
                        <div
                          key={admin.id}
                          className="flex items-center justify-between p-4 bg-content1 border border-divider rounded-xl shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar
                              src={admin.imageUrl}
                              name={admin.name.charAt(0).toUpperCase()}
                              size="md"
                              color="primary"
                              showFallback
                            />
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-foreground">
                                  {admin.name}
                                </p>
                              </div>
                              <p className="text-sm text-foreground-500">
                                {admin.email}
                              </p>
                              <p className="text-xs text-foreground-400">
                                Joined {formatDate(admin.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Chip size="sm" color={getRoleColor(admin.role)} variant="flat" className="font-medium">
                              {admin.role.replace('_', ' ')}
                            </Chip>
                            {(admin.role === "ADMIN" || admin.role === "SUPER_ADMIN") && (
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="warning"
                                onClick={() => handleDemoteUser(admin.userId, admin.role)}
                                isLoading={isUpdatingRole === admin.userId}
                                className="opacity-60 hover:opacity-100"
                                title={admin.role === "SUPER_ADMIN" ? "Demote to Admin" : "Demote to User"}
                              >
                                <IconArrowDown size={16} />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
              <div className="p-6">
                {pendingInvitations.length === 0 ? (
                  <div className="text-center py-12">
                    <IconMail size={48} className="mx-auto text-foreground-300 mb-4" />
                    <p className="text-foreground-500">No pending invitations</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingInvitations.map((invitation) => (
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
                          <Chip size="sm" color={getRoleColor(invitation.role)} variant="flat">
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
                            title="Cancel Invitation"
                          >
                            <IconX size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Pagination */}
      <AdminPagination
        totalResults={total}
        limit={itemsPerPage}
        showControls
      />

      {/* Edit User Modal */}
      <BottomSheet
        isOpen={isEditOpen}
        onClose={onEditClose}
        title="Edit User"
        size="md"
      >
        {selectedUser && (
          <EditUserForm
            user={selectedUser}
            onSave={updateUser}
            onCancel={onEditClose}
          />
        )}
      </BottomSheet>

      {/* Delete User Modal */}
      <BottomSheet
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        title="Delete User"
        size="md"
        footer={
          <>
            <Button variant="ghost" onPress={onDeleteClose}>
              Cancel
            </Button>
            <Button color="danger" onPress={deleteUser}>
              Delete
            </Button>
          </>
        }
      >
        {selectedUser && (
          <div>
            <p className="mb-4">Are you sure you want to permanently delete this user?</p>
            <div className="p-4 bg-danger/10 rounded-lg border-l-4 border-danger">
              <h4 className="font-semibold text-danger mb-2">⚠️ Warning: This action cannot be undone!</h4>
              <p className="text-sm text-foreground-600">
                This will permanently delete:
              </p>
              <ul className="text-sm text-foreground-600 mt-2 ml-4 list-disc">
                <li>User account and profile</li>
                <li>All workout logs and progress</li>
                <li>Personal bests and achievements</li>
                <li>Challenge participation and posts</li>
                <li>Equipment preferences and goals</li>
                <li>All related data from both database and Clerk</li>
              </ul>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Invite User Modal */}
      <BottomSheet
        isOpen={isInviteOpen}
        onClose={onInviteClose}
        title="Invite New User"
        size="lg"
      >
        <InviteUserForm
          onSuccess={handleInviteSuccess}
          onCancel={onInviteClose}
        />
      </BottomSheet>
    </div>
  );
}

function EditUserForm({
  user,
  onSave,
  onCancel
}: {
  user: User;
  onSave: (data: Partial<User>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    role: user.role,
    age: user.age?.toString() || "",
    height: user.height?.toString() || "",
    weight: user.weight?.toString() || "",
  });

  const handleSubmit = () => {
    onSave({
      role: formData.role as any,
      age: formData.age ? parseInt(formData.age) : undefined,
      height: formData.height ? parseFloat(formData.height) : undefined,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
    });
  };

  return (
    <div className="space-y-4">
      <Select
        label="Role"
        selectedKeys={[formData.role]}
        onSelectionChange={(keys) =>
          setFormData({ ...formData, role: Array.from(keys)[0] as any })
        }
      >
        <SelectItem key="USER">User</SelectItem>
        <SelectItem key="ADMIN">Admin</SelectItem>
        <SelectItem key="SUPER_ADMIN">Super Admin</SelectItem>
      </Select>

      <Input
        type="number"
        label="Age"
        value={formData.age}
        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
      />

      <Input
        type="number"
        label="Height (cm)"
        value={formData.height}
        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
      />

      <Input
        type="number"
        label="Weight (kg)"
        value={formData.weight}
        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
      />

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onPress={onCancel}>
          Cancel
        </Button>
        <Button color="primary" onPress={handleSubmit}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}