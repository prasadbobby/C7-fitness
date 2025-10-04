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
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

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

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      setUsers(data.users);
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

  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-foreground-500 mt-2">
            Manage user accounts, roles, and permissions.
          </p>
        </div>
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
              <div className="p-2 bg-success/10 rounded-lg">
                <IconBarbell size={20} className="text-success" />
              </div>
              <div>
                <p className="text-sm text-foreground-500">Active Assignments</p>
                <p className="text-xl font-bold text-foreground">
                  {users.reduce((sum, user) => sum + user._count.assignedWorkouts, 0)}
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

      {/* Users Table */}
      <Card>
        <CardBody className="p-0">
          <Table aria-label="Users table">
            <TableHeader>
              <TableColumn>USER ID</TableColumn>
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
                        name={(() => {
                          const name = user.username || user.firstName || user.email;
                          if (name) {
                            if (name.includes('@')) {
                              return name.split('@')[0].charAt(0).toUpperCase();
                            }
                            return name.charAt(0).toUpperCase();
                          }
                          return "U";
                        })()}
                        size="sm"
                        classNames={{
                          name: "font-bold"
                        }}
                        color="primary"
                        showFallback
                      />
                      <div>
                        <div className="font-medium text-sm">
                          {user.username || user.firstName || user.email || "Unknown User"}
                        </div>
                        {user.email && (user.email !== (user.username || user.firstName)) && (
                          <div className="text-xs text-foreground-500">
                            {user.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip color={getRoleColor(user.role)} variant="flat" size="sm">
                      {user.role}
                    </Chip>
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
                      {new Date(user.createdAt).toLocaleDateString()}
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
                        aria-label="View user progress"
                      >
                        <IconChartLine size={16} />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        onPress={() => handleEditUser(user)}
                        title="Edit User"
                        aria-label="Edit user"
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
                        aria-label="Delete user"
                      >
                        <IconTrash size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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