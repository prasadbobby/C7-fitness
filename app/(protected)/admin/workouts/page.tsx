"use client";

import { useState, useEffect } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import AdminPagination from "@/components/Admin/AdminPagination";
import AdminPerPageSelector from "@/components/Admin/AdminPerPageSelector";
import AdminModal from "@/components/Admin/AdminModal";
import BottomSheet from "@/components/UI/BottomSheet";
import DatePicker from "@/components/UI/DatePicker";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  useDisclosure,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Tabs,
  Tab,
  Checkbox,
  Accordion,
  AccordionItem,
  Pagination,
  Avatar,
} from "@nextui-org/react";
import {
  IconPlus,
  IconSearch,
  IconBarbell,
  IconUsers,
  IconCalendar,
  IconTarget,
  IconUserX,
  IconEdit,
  IconFilter,
  IconFilterX,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import { toast } from "sonner";

interface User {
  id: string;
  userId: string;
  role: string;
  age?: number;
  height?: number;
  weight?: number;
}

interface WorkoutPlan {
  id: string;
  name: string;
  notes?: string;
  systemRoutineCategory?: string;
  isSystemRoutine: boolean;
  WorkoutPlanExercise: Array<{
    Exercise: {
      name: string;
      category: string;
    };
    sets: number;
    reps?: number;
    exerciseDuration?: number;
  }>;
}

interface Assignment {
  id: string;
  userId: string;
  workoutPlanId: string;
  assignedBy: string;
  assignedAt: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED" | "ABSENT";
  notes?: string;
  user: {
    userId: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    imageUrl?: string;
  };
  workoutPlan: {
    name: string;
    systemRoutineCategory?: string;
  };
}

export default function WorkoutAssignment() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedWorkout, setSelectedWorkout] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [assignmentDate, setAssignmentDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editAssignmentDate, setEditAssignmentDate] = useState("");
  const [totalWorkouts, setTotalWorkouts] = useState(0);

  // Get values from URL parameters
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const searchTerm = searchParams.get("search") || "";

  // Advanced Filter States
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [userRoleFilter, setUserRoleFilter] = useState<Set<string>>(new Set());
  const [workoutTypeFilter, setWorkoutTypeFilter] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<Set<string>>(new Set());
  const [assignedDateFrom, setAssignedDateFrom] = useState("");
  const [assignedDateTo, setAssignedDateTo] = useState("");
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);

  const { isOpen: isAssignOpen, onOpen: onAssignOpen, onClose: onAssignClose } = useDisclosure();

  // Debug modal state
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();

  useEffect(() => {
    fetchData();
  }, [page, searchTerm]);

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

  const handlePageChange = (newPage: number) => {
    updateURLParams({ page: newPage });
  };

  const fetchData = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: searchTerm,
      });

      const [usersRes, workoutsRes, assignmentsRes] = await Promise.all([
        fetch("/api/admin/users?limit=1000"),
        fetch(`/api/admin/workouts?${params}`),
        fetch("/api/admin/assignments"),
      ]);

      const [usersData, workoutsData, assignmentsData] = await Promise.all([
        usersRes.json(),
        workoutsRes.json(),
        assignmentsRes.json(),
      ]);

      setUsers(usersData.users || []);
      setWorkoutPlans(workoutsData.workouts || []);
      setTotalWorkouts(workoutsData.total || 0);
      setAssignments(assignmentsData.assignments || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleAssignWorkout = async () => {
    console.log("Assign workout button clicked", { selectedUser, selectedWorkout });
    if (!selectedUser || !selectedWorkout) {
      console.log("Missing user or workout selection");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser,
          workoutPlanId: selectedWorkout,
          notes,
          assignmentDate: assignmentDate || undefined,
        }),
      });

      if (response.ok) {
        await fetchData();
        setSelectedUser("");
        setSelectedWorkout("");
        setNotes("");
        setAssignmentDate("");
        onAssignClose();
        toast.success("Workout assigned successfully!");
      } else {
        const errorData = await response.json();

        if (errorData.error === "USER_ALREADY_HAS_WORKOUT_TODAY" || errorData.error === "DUPLICATE_WORKOUT_ASSIGNMENT") {
          toast.error(`Cannot assign workout: User already has "${errorData.existingWorkout}" workout assigned for ${errorData.date}`);
        } else {
          toast.error(errorData.message || "Failed to assign workout");
        }
      }
    } catch (error) {
      console.error("Error assigning workout:", error);
      toast.error("Failed to assign workout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateAssignmentStatus = async (assignmentId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("Error updating assignment:", error);
    }
  };

  const openEditModal = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setEditStatus(assignment.status);
    setEditNotes(assignment.notes || "");
    setEditAssignmentDate(assignment.assignedAt ? assignment.assignedAt.split('T')[0] : "");
    onEditOpen();
  };

  const handleUpdateAssignment = async () => {
    if (!editingAssignment) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/assignments/${editingAssignment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          notes: editNotes,
          assignmentDate: editAssignmentDate || null,
        }),
      });

      if (response.ok) {
        await fetchData();
        onEditClose();
        setEditingAssignment(null);
        toast.success("Assignment updated successfully!");
      } else {
        const errorData = await response.json();

        if (errorData.error === "USER_ALREADY_HAS_WORKOUT_TODAY" || errorData.error === "DUPLICATE_WORKOUT_ASSIGNMENT") {
          toast.error(`Cannot update assignment: User already has "${errorData.existingWorkout}" workout assigned for ${errorData.date}`);
        } else {
          toast.error(errorData.message || "Failed to update assignment");
        }
      }
    } catch (error) {
      console.error("Error updating assignment:", error);
      toast.error("Failed to update assignment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "warning";
      case "IN_PROGRESS":
        return "primary";
      case "COMPLETED":
        return "success";
      case "SKIPPED":
        return "danger";
      case "ABSENT":
        return "secondary";
      default:
        return "default";
    }
  };

  // Helper function to clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter(new Set());
    setUserRoleFilter(new Set());
    setWorkoutTypeFilter(new Set());
    setCategoryFilter(new Set());
    setAssignedDateFrom("");
    setAssignedDateTo("");
    setShowOverdueOnly(false);
  };

  // Get unique categories from workout plans
  const uniqueCategories = [...new Set(workoutPlans
    .filter(wp => wp.systemRoutineCategory)
    .map(wp => wp.systemRoutineCategory!)
  )];

  // Get unique user roles
  const uniqueUserRoles = [...new Set(users.map(u => u.role))];

  // Check if any advanced filters are active
  const hasActiveFilters =
    statusFilter.size > 0 ||
    userRoleFilter.size > 0 ||
    workoutTypeFilter.size > 0 ||
    categoryFilter.size > 0 ||
    assignedDateFrom ||
    assignedDateTo ||
    showOverdueOnly;

  const filteredAssignments = assignments.filter(assignment => {
    // Get user data for this assignment
    const user = users.find(u => u.userId === assignment.user.userId);
    const workoutPlan = workoutPlans.find(wp => wp.id === assignment.workoutPlanId);

    // Basic search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        assignment.user.userId.toLowerCase().includes(searchLower) ||
        assignment.workoutPlan.name.toLowerCase().includes(searchLower) ||
        (user?.username && user.username.toLowerCase().includes(searchLower)) ||
        (user?.firstName && user.firstName.toLowerCase().includes(searchLower)) ||
        (user?.email && user.email.toLowerCase().includes(searchLower)) ||
        (assignment.notes && assignment.notes.toLowerCase().includes(searchLower)) ||
        (assignment.workoutPlan.systemRoutineCategory &&
         assignment.workoutPlan.systemRoutineCategory.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter.size > 0 && !statusFilter.has(assignment.status)) {
      return false;
    }

    // User role filter
    if (userRoleFilter.size > 0 && user && !userRoleFilter.has(user.role)) {
      return false;
    }

    // Workout type filter
    if (workoutTypeFilter.size > 0 && workoutPlan) {
      const isSystemRoutine = workoutPlan.isSystemRoutine;
      const type = isSystemRoutine ? "system" : "custom";
      if (!workoutTypeFilter.has(type)) {
        return false;
      }
    }

    // Category filter
    if (categoryFilter.size > 0) {
      if (!assignment.workoutPlan.systemRoutineCategory ||
          !categoryFilter.has(assignment.workoutPlan.systemRoutineCategory)) {
        return false;
      }
    }

    // Assigned date filter
    if (assignedDateFrom) {
      const assignedDate = new Date(assignment.assignedAt);
      const fromDate = new Date(assignedDateFrom);
      if (assignedDate < fromDate) return false;
    }

    if (assignedDateTo) {
      const assignedDate = new Date(assignment.assignedAt);
      const toDate = new Date(assignedDateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      if (assignedDate > toDate) return false;
    }

    // Since we removed due dates, remove overdue filter as well
    // Assignments are now based on assignment date, not due date

    return true;
  });

  const stats = {
    totalAssignments: assignments.length,
    pendingAssignments: assignments.filter(a => a.status === "PENDING").length,
    activeAssignments: assignments.filter(a => a.status === "IN_PROGRESS").length,
    completedAssignments: assignments.filter(a => a.status === "COMPLETED").length,
    absentAssignments: assignments.filter(a => a.status === "ABSENT").length,
    overdueAssignments: 0, // Removed overdue concept since we don't use due dates
    completionRate: assignments.length > 0
      ? Math.round((assignments.filter(a => a.status === "COMPLETED").length / assignments.length) * 100)
      : 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Workout Assignment</h1>
          <p className="text-foreground-500 mt-2">
            Assign personalized workouts to users and track their progress.
          </p>
        </div>
        <Button
          color="primary"
          startContent={<IconPlus size={20} />}
          onPress={onAssignOpen}
          className="min-h-12 px-4 w-full sm:w-auto"
          size="lg"
        >
          Assign Workout
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <IconTarget size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm text-foreground-500">Total</p>
                <p className="text-xl font-bold text-foreground">{stats.totalAssignments}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <IconCalendar size={20} className="text-warning" />
              </div>
              <div>
                <p className="text-sm text-foreground-500">Pending</p>
                <p className="text-xl font-bold text-foreground">{stats.pendingAssignments}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <IconBarbell size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm text-foreground-500">Active</p>
                <p className="text-xl font-bold text-foreground">{stats.activeAssignments}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <IconTarget size={20} className="text-success" />
              </div>
              <div>
                <p className="text-sm text-foreground-500">Completed</p>
                <p className="text-xl font-bold text-foreground">{stats.completedAssignments}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <IconUserX size={20} className="text-secondary" />
              </div>
              <div>
                <p className="text-sm text-foreground-500">Absent</p>
                <p className="text-xl font-bold text-foreground">{stats.absentAssignments}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <IconTarget size={20} className="text-success" />
              </div>
              <div>
                <p className="text-sm text-foreground-500">Success Rate</p>
                <p className="text-xl font-bold text-foreground">{stats.completionRate}%</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Advanced Search and Filter */}
      <Card>
        <CardBody className="p-4">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-3">
              <Input
                placeholder="Search assignments, users, workouts, notes..."
                startContent={<IconSearch size={20} />}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="flex-1"
              />
              <AdminPerPageSelector />
              <Button
                variant={showAdvancedFilters ? "solid" : "flat"}
                color={hasActiveFilters ? "primary" : "default"}
                startContent={<IconFilter size={20} />}
                endContent={showAdvancedFilters ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                Filters
                {hasActiveFilters && (
                  <Chip size="sm" color="primary" className="ml-1">
                    {[
                      statusFilter.size,
                      userRoleFilter.size,
                      workoutTypeFilter.size,
                      categoryFilter.size,
                      assignedDateFrom ? 1 : 0,
                      assignedDateTo ? 1 : 0,
                      showOverdueOnly ? 1 : 0
                    ].reduce((a, b) => a + b, 0)}
                  </Chip>
                )}
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="flat"
                  color="danger"
                  startContent={<IconFilterX size={20} />}
                  onPress={clearAllFilters}
                >
                  Clear All
                </Button>
              )}
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
              <div className="border-t border-divider pt-6 animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {/* Status Filter Card */}
                  <Card className="shadow-sm border border-divider/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-lg">
                          <IconTarget size={16} className="text-primary" />
                        </div>
                        <h4 className="text-sm font-semibold text-foreground">Assignment Status</h4>
                        {statusFilter.size > 0 && (
                          <Chip size="sm" color="primary" variant="flat">
                            {statusFilter.size}
                          </Chip>
                        )}
                      </div>
                    </CardHeader>
                    <CardBody className="pt-0">
                      <div className="grid grid-cols-1 gap-3">
                        {["PENDING", "IN_PROGRESS", "COMPLETED", "SKIPPED", "ABSENT"].map((status) => (
                          <div
                            key={status}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:scale-[1.02] ${
                              statusFilter.has(status)
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-divider hover:border-primary/50 hover:bg-content2"
                            }`}
                            onClick={() => {
                              const newSet = new Set(statusFilter);
                              if (statusFilter.has(status)) {
                                newSet.delete(status);
                              } else {
                                newSet.add(status);
                              }
                              setStatusFilter(newSet);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <Chip color={getStatusColor(status)} variant="flat" size="sm">
                                {status.replace('_', ' ')}
                              </Chip>
                              <div className={`w-4 h-4 rounded border-2 transition-all ${
                                statusFilter.has(status)
                                  ? "bg-primary border-primary"
                                  : "border-divider"
                              }`}>
                                {statusFilter.has(status) && (
                                  <IconTarget size={12} className="text-white" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>

                  {/* Role & Type Filters Card */}
                  <Card className="shadow-sm border border-divider/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-secondary/10 rounded-lg">
                          <IconUsers size={16} className="text-secondary" />
                        </div>
                        <h4 className="text-sm font-semibold text-foreground">User & Workout Type</h4>
                        {(userRoleFilter.size + workoutTypeFilter.size) > 0 && (
                          <Chip size="sm" color="secondary" variant="flat">
                            {userRoleFilter.size + workoutTypeFilter.size}
                          </Chip>
                        )}
                      </div>
                    </CardHeader>
                    <CardBody className="pt-0 space-y-4">
                      {/* User Roles */}
                      <div>
                        <p className="text-xs font-medium text-foreground-600 mb-2 uppercase tracking-wide">User Roles</p>
                        <div className="flex flex-wrap gap-2">
                          {uniqueUserRoles.map((role) => (
                            <Chip
                              key={role}
                              variant={userRoleFilter.has(role) ? "solid" : "flat"}
                              color={userRoleFilter.has(role) ? "secondary" : "default"}
                              size="sm"
                              className="cursor-pointer transition-all hover:scale-105"
                              onClick={() => {
                                const newSet = new Set(userRoleFilter);
                                if (userRoleFilter.has(role)) {
                                  newSet.delete(role);
                                } else {
                                  newSet.add(role);
                                }
                                setUserRoleFilter(newSet);
                              }}
                            >
                              {role.toLowerCase().replace('_', ' ')}
                            </Chip>
                          ))}
                        </div>
                      </div>

                      {/* Workout Types */}
                      <div>
                        <p className="text-xs font-medium text-foreground-600 mb-2 uppercase tracking-wide">Workout Types</p>
                        <div className="flex flex-wrap gap-2">
                          {["system", "custom"].map((type) => (
                            <Chip
                              key={type}
                              variant={workoutTypeFilter.has(type) ? "solid" : "flat"}
                              color={workoutTypeFilter.has(type) ? "success" : "default"}
                              size="sm"
                              className="cursor-pointer transition-all hover:scale-105"
                              onClick={() => {
                                const newSet = new Set(workoutTypeFilter);
                                if (workoutTypeFilter.has(type)) {
                                  newSet.delete(type);
                                } else {
                                  newSet.add(type);
                                }
                                setWorkoutTypeFilter(newSet);
                              }}
                              startContent={type === "system" ? <IconBarbell size={14} /> : <IconEdit size={14} />}
                            >
                              {type} routines
                            </Chip>
                          ))}
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Categories & Special Filters Card */}
                  <Card className="shadow-sm border border-divider/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-warning/10 rounded-lg">
                          <IconBarbell size={16} className="text-warning" />
                        </div>
                        <h4 className="text-sm font-semibold text-foreground">Categories & Special</h4>
                        {(categoryFilter.size + (showOverdueOnly ? 1 : 0)) > 0 && (
                          <Chip size="sm" color="warning" variant="flat">
                            {categoryFilter.size + (showOverdueOnly ? 1 : 0)}
                          </Chip>
                        )}
                      </div>
                    </CardHeader>
                    <CardBody className="pt-0 space-y-4">
                      {/* Categories */}
                      {uniqueCategories.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-foreground-600 mb-2 uppercase tracking-wide">Categories</p>
                          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                            {uniqueCategories.map((category) => (
                              <Chip
                                key={category}
                                variant={categoryFilter.has(category) ? "solid" : "flat"}
                                color={categoryFilter.has(category) ? "warning" : "default"}
                                size="sm"
                                className="cursor-pointer transition-all hover:scale-105"
                                onClick={() => {
                                  const newSet = new Set(categoryFilter);
                                  if (categoryFilter.has(category)) {
                                    newSet.delete(category);
                                  } else {
                                    newSet.add(category);
                                  }
                                  setCategoryFilter(newSet);
                                }}
                              >
                                {category}
                              </Chip>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Special Filters */}
                      <div>
                        <p className="text-xs font-medium text-foreground-600 mb-2 uppercase tracking-wide">Special Filters</p>
                        <div
                          className={`p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:scale-[1.02] ${
                            showOverdueOnly
                              ? "border-danger bg-danger/5 shadow-sm"
                              : "border-divider hover:border-danger/50 hover:bg-content2"
                          }`}
                          onClick={() => setShowOverdueOnly(!showOverdueOnly)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <IconCalendar size={16} className={showOverdueOnly ? "text-danger" : "text-foreground-500"} />
                              <span className="text-sm font-medium">Overdue Only</span>
                            </div>
                            <div className={`w-4 h-4 rounded border-2 transition-all ${
                              showOverdueOnly
                                ? "bg-danger border-danger"
                                : "border-divider"
                            }`}>
                              {showOverdueOnly && (
                                <IconTarget size={12} className="text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>

                {/* Date Filters Section */}
                <Card className="mt-6 shadow-sm border border-divider/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-success/10 rounded-lg">
                        <IconCalendar size={16} className="text-success" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground">Assignment Date Filter</h4>
                      {(assignedDateFrom || assignedDateTo) && (
                        <Chip size="sm" color="success" variant="flat">
                          Active
                        </Chip>
                      )}
                    </div>
                  </CardHeader>
                  <CardBody className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <p className="text-sm font-medium text-foreground">Assignment Date Range</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <DatePicker
                          label="From"
                          size="sm"
                          value={assignedDateFrom ? new Date(assignedDateFrom) : undefined}
                          onChange={(date) => setAssignedDateFrom(date ? date.toISOString().split('T')[0] : '')}
                          className="transition-all focus-within:scale-[1.02]"
                        />
                        <DatePicker
                          label="To"
                          size="sm"
                          value={assignedDateTo ? new Date(assignedDateTo) : undefined}
                          onChange={(date) => setAssignedDateTo(date ? date.toISOString().split('T')[0] : '')}
                          className="transition-all focus-within:scale-[1.02]"
                        />
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Filter Results Summary */}
                <div className="mt-6 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-divider/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IconSearch size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Showing {filteredAssignments.length} of {assignments.length} assignments
                        </p>
                        <p className="text-xs text-foreground-500">
                          {assignments.length - filteredAssignments.length > 0
                            ? `${assignments.length - filteredAssignments.length} assignments hidden by filters`
                            : "All assignments visible"
                          }
                        </p>
                      </div>
                    </div>
                    {hasActiveFilters && (
                      <div className="flex gap-2 text-xs flex-wrap">
                        {statusFilter.size > 0 && (
                          <Chip size="sm" variant="flat" color="primary">
                            Status ({statusFilter.size})
                          </Chip>
                        )}
                        {userRoleFilter.size > 0 && (
                          <Chip size="sm" variant="flat" color="secondary">
                            Role ({userRoleFilter.size})
                          </Chip>
                        )}
                        {workoutTypeFilter.size > 0 && (
                          <Chip size="sm" variant="flat" color="success">
                            Type ({workoutTypeFilter.size})
                          </Chip>
                        )}
                        {categoryFilter.size > 0 && (
                          <Chip size="sm" variant="flat" color="warning">
                            Category ({categoryFilter.size})
                          </Chip>
                        )}
                        {showOverdueOnly && (
                          <Chip size="sm" variant="flat" color="danger">
                            Overdue
                          </Chip>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Assignment History</h3>
        </CardHeader>
        <CardBody className="p-0">
          <Table aria-label="Assignments table">
            <TableHeader>
              <TableColumn>USER</TableColumn>
              <TableColumn>WORKOUT</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>ASSIGNMENT DATE</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No assignments found">
              {filteredAssignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={assignment.user.imageUrl}
                        name={(() => {
                          const name = assignment.user.username || assignment.user.firstName || assignment.user.email;
                          if (name) {
                            // Get first letter of name, or first letter of email if no name
                            if (name.includes('@')) {
                              return name.split('@')[0].charAt(0).toUpperCase();
                            }
                            return name.charAt(0).toUpperCase();
                          }
                          return "U";
                        })()}
                        size="sm"
                        className="flex-shrink-0 font-bold"
                        classNames={{
                          name: "font-bold"
                        }}
                        color="primary"
                        showFallback
                      />
                      <div>
                        <div className="font-medium text-sm">
                          {assignment.user.username || assignment.user.firstName || assignment.user.email || "Unknown User"}
                        </div>
                        {assignment.user.email && (assignment.user.email !== (assignment.user.username || assignment.user.firstName)) && (
                          <div className="text-xs text-foreground-500">
                            {assignment.user.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{assignment.workoutPlan.name}</p>
                      {assignment.workoutPlan.systemRoutineCategory && (
                        <p className="text-sm text-foreground-500">
                          {assignment.workoutPlan.systemRoutineCategory}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip color={getStatusColor(assignment.status)} variant="flat" size="sm">
                      {assignment.status}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(assignment.assignedAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-foreground-400">
                      {(() => {
                        const assignmentDate = new Date(assignment.assignedAt);
                        const today = new Date();

                        // Set time to 00:00:00 for accurate date-only comparison
                        assignmentDate.setHours(0, 0, 0, 0);
                        today.setHours(0, 0, 0, 0);

                        const diffTime = today.getTime() - assignmentDate.getTime();
                        const diffDays = Math.floor(Math.abs(diffTime) / (1000 * 60 * 60 * 24));

                        if (diffTime > 0) {
                          return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
                        } else if (diffTime < 0) {
                          return diffDays === 1 ? "In 1 day" : `In ${diffDays} days`;
                        } else {
                          return "Today";
                        }
                      })()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        startContent={<IconEdit size={16} />}
                        onPress={() => openEditModal(assignment)}
                      >
                        Edit
                      </Button>
                      <Select
                        size="sm"
                        label="Status"
                        placeholder="Update status"
                        className="w-32"
                        selectedKeys={[assignment.status]}
                        onSelectionChange={(keys) => {
                          const status = Array.from(keys)[0] as string;
                          if (status !== assignment.status) {
                            updateAssignmentStatus(assignment.id, status);
                          }
                        }}
                      >
                        <SelectItem key="PENDING">Pending</SelectItem>
                        <SelectItem key="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem key="COMPLETED">Completed</SelectItem>
                        <SelectItem key="SKIPPED">Skipped</SelectItem>
                        <SelectItem key="ABSENT">Absent</SelectItem>
                      </Select>
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
        totalResults={totalWorkouts}
        limit={limit}
        showControls
      />

      {/* Assign Workout Modal */}
      <BottomSheet
        isOpen={isAssignOpen}
        onClose={onAssignClose}
        title="Assign Workout to User"
        size="2xl"
        footer={
          <>
            <Button variant="ghost" onPress={onAssignClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleAssignWorkout}
              isLoading={loading}
              isDisabled={!selectedUser || !selectedWorkout}
            >
              Assign Workout
            </Button>
          </>
        }
      >
        <div className="space-y-4">
              <Select
                label="Select User"
                placeholder="Choose a user to assign workout"
                selectedKeys={selectedUser ? [selectedUser] : []}
                onSelectionChange={(keys) => setSelectedUser(Array.from(keys)[0] as string)}
                classNames={{
                  trigger: "min-h-12",
                  value: "text-foreground",
                }}
                renderValue={(items) => {
                  return items.map((item) => {
                    const user = users.find(u => u.userId === item.key);
                    return user ? (
                      <div key={item.key} className="flex items-center gap-2">
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
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {user.username || user.firstName || user.email || "Unknown User"}
                          </span>
                          {user.email && user.email !== (user.username || user.firstName) && (
                            <span className="text-xs text-foreground-500">{user.email}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span key={item.key}>Unknown User</span>
                    );
                  });
                }}
              >
                {users.map((user) => (
                  <SelectItem key={user.userId} value={user.userId} textValue={user.username || user.firstName || user.email || user.userId}>
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
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {user.username || user.firstName || user.email || "Unknown User"}
                        </span>
                        {user.email && (user.email !== (user.username || user.firstName)) && (
                          <span className="text-xs text-foreground-500">{user.email}</span>
                        )}
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            user.role === "ADMIN" || user.role === "SUPER_ADMIN"
                              ? "bg-warning/10 text-warning"
                              : "bg-primary/10 text-primary"
                          }`}>
                            {user.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </Select>

              <Select
                label="Select Workout Plan"
                placeholder="Choose a workout plan to assign"
                selectedKeys={selectedWorkout ? [selectedWorkout] : []}
                onSelectionChange={(keys) => setSelectedWorkout(Array.from(keys)[0] as string)}
                classNames={{
                  trigger: "min-h-12",
                  value: "text-foreground",
                }}
              >
                {workoutPlans.map((workout) => (
                  <SelectItem key={workout.id} value={workout.id} textValue={workout.name}>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{workout.name}</span>
                        {workout.systemRoutineCategory && (
                          <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded">
                            {workout.systemRoutineCategory}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-foreground-500">
                        <span>{workout.WorkoutPlanExercise.length} exercises</span>
                        <span>•</span>
                        <span>{workout.isSystemRoutine ? "System" : "Custom"} routine</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </Select>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePicker
                  label="Assignment Date (Optional)"
                  placeholder="Select assignment date"
                  value={assignmentDate ? new Date(assignmentDate) : undefined}
                  onChange={(date) => setAssignmentDate(date ? date.toISOString().split('T')[0] : '')}
                />
                <div className="flex items-end">
                  <Button
                    variant="flat"
                    size="md"
                    onPress={() => setAssignmentDate(new Date().toISOString().split('T')[0])}
                    className="w-full"
                  >
                    Set Today
                  </Button>
                </div>
              </div>

              <Textarea
                label="Notes (Optional)"
                placeholder="Add specific instructions, modifications, or notes for this workout assignment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                classNames={{
                  input: "text-foreground",
                  label: "text-foreground",
                }}
                rows={3}
              />

              {selectedWorkout && (
                <Card className="bg-content1 border border-divider">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <IconBarbell size={20} className="text-primary" />
                      <h4 className="text-md font-semibold text-foreground">Workout Preview</h4>
                    </div>
                  </CardHeader>
                  <CardBody className="pt-0">
                    {(() => {
                      const workout = workoutPlans.find(w => w.id === selectedWorkout);
                      return workout ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-foreground">{workout.name}</p>
                              {workout.systemRoutineCategory && (
                                <p className="text-sm text-foreground-500">{workout.systemRoutineCategory}</p>
                              )}
                            </div>
                            <div className="text-right text-sm text-foreground-500">
                              <p>{workout.WorkoutPlanExercise.length} exercises</p>
                              <p>{workout.isSystemRoutine ? "System" : "Custom"} routine</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h5 className="text-sm font-medium text-foreground">Exercise List:</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {workout.WorkoutPlanExercise.slice(0, 6).map((exercise, index) => (
                                <div key={index} className="p-3 bg-content2 rounded-lg border border-divider">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="font-medium text-sm text-foreground">{exercise.Exercise.name}</p>
                                      <p className="text-xs text-foreground-500 mt-1">
                                        {exercise.sets} sets × {exercise.reps || exercise.exerciseDuration}
                                        {exercise.exerciseDuration ? "s" : " reps"}
                                      </p>
                                    </div>
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded ml-2">
                                      #{index + 1}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {workout.WorkoutPlanExercise.length > 6 && (
                              <div className="text-center">
                                <p className="text-sm text-foreground-500">
                                  + {workout.WorkoutPlanExercise.length - 6} more exercises
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </CardBody>
                </Card>
              )}
            </div>
      </BottomSheet>

      {/* Edit Assignment Modal */}
      <BottomSheet
        isOpen={isEditOpen}
        onClose={onEditClose}
        size="lg"
        title="Edit Assignment"
        footer={
          <>
            <Button variant="ghost" onPress={onEditClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleUpdateAssignment}
              isLoading={loading}
            >
              Update Assignment
            </Button>
          </>
        }
      >
        {editingAssignment && (
          <div className="space-y-4">
            <div className="p-4 bg-content2 rounded-lg">
              <h4 className="font-semibold text-foreground mb-2">Assignment Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-foreground-500">User:</p>
                  <p className="font-medium">{editingAssignment.user.username || editingAssignment.user.firstName || editingAssignment.user.email || "Unknown User"}</p>
                </div>
                <div>
                  <p className="text-foreground-500">Workout:</p>
                  <p className="font-medium">{editingAssignment.workoutPlan.name}</p>
                </div>
                <div>
                  <p className="text-foreground-500">Assigned:</p>
                  <p className="font-medium">{new Date(editingAssignment.assignedAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-foreground-500">Current Status:</p>
                  <Chip color={getStatusColor(editingAssignment.status)} variant="flat" size="sm">
                    {editingAssignment.status}
                  </Chip>
                </div>
              </div>
            </div>

            <Select
              label="Status"
              placeholder="Select status"
              selectedKeys={editStatus ? [editStatus] : []}
              onSelectionChange={(keys) => setEditStatus(Array.from(keys)[0] as string)}
            >
              <SelectItem key="PENDING">Pending</SelectItem>
              <SelectItem key="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem key="COMPLETED">Completed</SelectItem>
              <SelectItem key="SKIPPED">Skipped</SelectItem>
              <SelectItem key="ABSENT">Absent</SelectItem>
            </Select>

            <DatePicker
              label="Assignment Date"
              placeholder="Select assignment date"
              value={editAssignmentDate ? new Date(editAssignmentDate) : undefined}
              onChange={(date) => setEditAssignmentDate(date ? date.toISOString().split('T')[0] : '')}
            />

            <Textarea
              label="Notes"
              placeholder="Add or update notes for this assignment..."
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={3}
            />
          </div>
        )}
      </BottomSheet>
    </div>
  );
}