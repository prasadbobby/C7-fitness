"use client";

import { useState, useEffect } from "react";
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
  Progress,
  Divider,
  Avatar,
} from "@nextui-org/react";
import {
  IconPlus,
  IconSearch,
  IconTrendingUp,
  IconTarget,
  IconCalendar,
  IconUsers,
  IconActivity,
  IconEdit,
  IconTrash,
  IconPlayerPlay,
  IconPlayerPause,
} from "@tabler/icons-react";

interface User {
  id: string;
  userId: string;
  role: string;
  username?: string;
  firstName?: string;
  email?: string;
}

interface StepGoal {
  id: string;
  userId: string;
  assignedBy: string;
  dailyTarget: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  userInfo?: User;
  stepLogs: Array<{
    id: string;
    date: string;
    actualSteps: number;
    targetSteps: number;
    isCompleted: boolean;
    carryOverSteps: number;
    excessSteps: number;
  }>;
}

export default function StepTrackingAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [stepGoals, setStepGoals] = useState<StepGoal[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [dailyTarget, setDailyTarget] = useState("");
  const [goalDuration, setGoalDuration] = useState("1"); // 1, 2, or 3 weeks
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingGoal, setEditingGoal] = useState<StepGoal | null>(null);

  const { isOpen: isAssignOpen, onOpen: onAssignOpen, onClose: onAssignClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, goalsRes] = await Promise.all([
        fetch("/api/admin/users?limit=1000"),
        fetch("/api/admin/step-goals"),
      ]);

      const [usersData, goalsData] = await Promise.all([
        usersRes.json(),
        goalsRes.json(),
      ]);

      setUsers(usersData.users || []);
      setStepGoals(goalsData.stepGoals || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const calculateEndDate = (weeks: number) => {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (weeks * 7));
    return endDate.toISOString().split('T')[0];
  };

  const handleAssignGoal = async () => {
    if (!selectedUser || !dailyTarget) return;

    setLoading(true);
    try {
      const calculatedEndDate = calculateEndDate(parseInt(goalDuration));

      const response = await fetch("/api/admin/step-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: selectedUser,
          dailyTarget: parseInt(dailyTarget),
          endDate: calculatedEndDate,
          notes,
          goalDurationWeeks: parseInt(goalDuration),
        }),
      });

      if (response.ok) {
        await fetchData();
        setSelectedUser("");
        setDailyTarget("");
        setGoalDuration("1");
        setEndDate("");
        setNotes("");
        onAssignClose();
      }
    } catch (error) {
      console.error("Error assigning step goal:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGoal = async () => {
    if (!editingGoal) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/step-goals/${editingGoal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyTarget: parseInt(dailyTarget),
          endDate: endDate || null,
          notes,
          isActive: editingGoal.isActive,
        }),
      });

      if (response.ok) {
        await fetchData();
        onEditClose();
        setEditingGoal(null);
      }
    } catch (error) {
      console.error("Error updating step goal:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGoalStatus = async (goalId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/step-goals/${goalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("Error toggling goal status:", error);
    }
  };

  const openEditModal = (goal: StepGoal) => {
    setEditingGoal(goal);
    setDailyTarget(goal.dailyTarget.toString());
    setEndDate(goal.endDate ? goal.endDate.split('T')[0] : "");
    setNotes(goal.notes || "");
    onEditOpen();
  };

  const filteredGoals = stepGoals.filter(goal =>
    goal.userInfo?.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    goal.userInfo?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    goal.userInfo?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    goal.userInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    goal.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalGoals: stepGoals.length,
    activeGoals: stepGoals.filter(g => g.isActive).length,
    completedToday: stepGoals.filter(g =>
      g.stepLogs[0]?.isCompleted &&
      new Date(g.stepLogs[0].date).toDateString() === new Date().toDateString()
    ).length,
    avgTarget: stepGoals.length > 0
      ? Math.round(stepGoals.reduce((sum, g) => sum + g.dailyTarget, 0) / stepGoals.length)
      : 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Step Tracking Management</h1>
          <p className="text-foreground-500 mt-2">
            Assign and manage daily step goals for users with automatic carry-over tracking.
          </p>
        </div>
        <Button
          color="primary"
          startContent={<IconPlus size={20} />}
          onPress={onAssignOpen}
          className="min-h-12 px-4 w-full sm:w-auto"
          size="lg"
        >
          Assign Step Goal
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <IconTarget size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm text-foreground-500">Total Goals</p>
                <p className="text-xl font-bold text-foreground">{stats.totalGoals}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <IconActivity size={20} className="text-success" />
              </div>
              <div>
                <p className="text-sm text-foreground-500">Active Goals</p>
                <p className="text-xl font-bold text-foreground">{stats.activeGoals}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <IconTrendingUp size={20} className="text-warning" />
              </div>
              <div>
                <p className="text-sm text-foreground-500">Completed Today</p>
                <p className="text-xl font-bold text-foreground">{stats.completedToday}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <IconUsers size={20} className="text-secondary" />
              </div>
              <div>
                <p className="text-sm text-foreground-500">Avg Target</p>
                <p className="text-xl font-bold text-foreground">{stats.avgTarget.toLocaleString()}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardBody className="p-4">
          <Input
            placeholder="Search users by name, email, or ID..."
            startContent={<IconSearch size={20} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardBody>
      </Card>

      {/* Step Goals Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Step Goals</h3>
        </CardHeader>
        <CardBody className="p-0">
          <Table aria-label="Step goals table">
            <TableHeader>
              <TableColumn>USER</TableColumn>
              <TableColumn>DAILY TARGET</TableColumn>
              <TableColumn>TODAY'S PROGRESS</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>STREAK</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No step goals found">
              {filteredGoals.map((goal) => {
                const todayLog = goal.stepLogs.find(log =>
                  new Date(log.date).toDateString() === new Date().toDateString()
                );
                const progressPercentage = todayLog
                  ? Math.min((todayLog.actualSteps / todayLog.targetSteps) * 100, 100)
                  : 0;

                return (
                  <TableRow key={goal.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={goal.userInfo?.imageUrl}
                          name={(() => {
                            const name = goal.userInfo?.username || goal.userInfo?.firstName || goal.userInfo?.email || goal.userId;
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
                            {goal.userInfo?.username || goal.userInfo?.firstName || goal.userInfo?.email || goal.userId || "Unknown User"}
                          </div>
                          {goal.userInfo?.email && (goal.userInfo?.email !== (goal.userInfo?.username || goal.userInfo?.firstName)) && (
                            <div className="text-xs text-foreground-500">
                              {goal.userInfo?.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{goal.dailyTarget.toLocaleString()} steps</p>
                        {todayLog && todayLog.carryOverSteps > 0 && (
                          <p className="text-xs text-warning">
                            +{todayLog.carryOverSteps} carry-over
                          </p>
                        )}
                        {todayLog && todayLog.excessSteps > 0 && (
                          <p className="text-xs text-success">
                            -{todayLog.excessSteps} credit
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {todayLog ? (
                          <>
                            <div className="flex justify-between text-sm">
                              <span>{todayLog.actualSteps.toLocaleString()}</span>
                              <span>{todayLog.targetSteps.toLocaleString()}</span>
                            </div>
                            <Progress
                              value={progressPercentage}
                              color={todayLog.isCompleted ? "success" : "primary"}
                              size="sm"
                              aria-label={`Step progress: ${progressPercentage.toFixed(1)}% completed`}
                            />
                            <p className="text-xs text-foreground-500">
                              {progressPercentage.toFixed(1)}% completed
                            </p>
                          </>
                        ) : (
                          <div className="text-sm text-foreground-500">No data today</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={goal.isActive ? "success" : "default"}
                        variant="flat"
                        size="sm"
                      >
                        {goal.isActive ? "Active" : "Inactive"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-semibold">
                          {goal.stepLogs.filter(log => log.isCompleted).length} days
                        </p>
                        <p className="text-xs text-foreground-500">
                          Last 7 days: {goal.stepLogs.slice(0, 7).filter(log => log.isCompleted).length}/7
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="flat"
                          color={goal.isActive ? "warning" : "success"}
                          startContent={goal.isActive ? <IconPlayerPause size={14} /> : <IconPlayerPlay size={14} />}
                          onPress={() => toggleGoalStatus(goal.id, goal.isActive)}
                        >
                          {goal.isActive ? "Pause" : "Resume"}
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          startContent={<IconEdit size={14} />}
                          onPress={() => openEditModal(goal)}
                        >
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Assign Goal Modal */}
      <BottomSheet
        isOpen={isAssignOpen}
        onClose={onAssignClose}
        size="2xl"
        title="🎯 Assign Step Goal"
        footer={
          <>
            <Button
              variant="light"
              onPress={onAssignClose}
              size="lg"
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleAssignGoal}
              isLoading={loading}
              isDisabled={!selectedUser || !dailyTarget}
              size="lg"
              className="px-8"
            >
              {loading ? "Creating Goal..." : "🚀 Create Goal"}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
              {/* User Selection */}
              <div className="space-y-2">
                <Select
                  label="Select User"
                  placeholder="Choose a user to assign step goal"
                  selectedKeys={selectedUser ? [selectedUser] : []}
                  onSelectionChange={(keys) => setSelectedUser(Array.from(keys)[0] as string)}
                  classNames={{
                    trigger: "min-h-14",
                  }}
                  startContent={<IconUsers size={20} className="text-foreground-500" />}
                >
                  {users.filter(user => user.role !== "ADMIN" && user.role !== "SUPER_ADMIN").map((user) => (
                    <SelectItem
                      key={user.userId}
                      value={user.userId}
                      textValue={user.username || user.firstName || user.email || "Unknown User"}
                    >
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
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </Select>
                {selectedUser && (
                  <div className="text-xs text-foreground-500 px-3">
                    ✓ Selected user will receive daily step tracking with carry-over system
                  </div>
                )}
              </div>

              {/* Step Target with Visual Indicator */}
              <div className="space-y-3">
                <Input
                  type="number"
                  label="Daily Step Target"
                  placeholder="e.g., 10000"
                  value={dailyTarget}
                  onChange={(e) => setDailyTarget(e.target.value)}
                  startContent={<IconTarget size={20} className="text-foreground-500" />}
                  endContent={<span className="text-foreground-500 font-medium">steps</span>}
                  classNames={{
                    input: "text-lg font-semibold",
                    inputWrapper: "min-h-14",
                  }}
                />
                {dailyTarget && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <IconActivity size={16} className="text-primary" />
                      <span className="text-sm font-medium text-primary">Target Preview</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-white/50 rounded-lg p-2">
                        <p className="text-xs text-foreground-500">Daily</p>
                        <p className="font-bold text-sm">{parseInt(dailyTarget || "0").toLocaleString()}</p>
                      </div>
                      <div className="bg-white/50 rounded-lg p-2">
                        <p className="text-xs text-foreground-500">Weekly</p>
                        <p className="font-bold text-sm">{(parseInt(dailyTarget || "0") * 7).toLocaleString()}</p>
                      </div>
                      <div className="bg-white/50 rounded-lg p-2">
                        <p className="text-xs text-foreground-500">3 Weeks</p>
                        <p className="font-bold text-sm">{(parseInt(dailyTarget || "0") * 21).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Goal Duration Selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Goal Duration</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { weeks: "1", label: "1 Week", desc: "Short-term goal", color: "bg-warning/10 border-warning/30 text-warning" },
                    { weeks: "2", label: "2 Weeks", desc: "Medium-term goal", color: "bg-primary/10 border-primary/30 text-primary" },
                    { weeks: "3", label: "3 Weeks", desc: "Long-term goal", color: "bg-success/10 border-success/30 text-success" },
                  ].map((option) => (
                    <div
                      key={option.weeks}
                      onClick={() => setGoalDuration(option.weeks)}
                      className={`
                        cursor-pointer border-2 rounded-lg p-4 transition-all duration-200 hover:scale-105
                        ${goalDuration === option.weeks
                          ? option.color
                          : "bg-content2 border-content3 hover:border-content4"
                        }
                      `}
                    >
                      <div className="text-center">
                        <IconCalendar size={24} className="mx-auto mb-2" />
                        <p className="font-semibold text-sm">{option.label}</p>
                        <p className="text-xs opacity-80 mt-1">{option.desc}</p>
                        {goalDuration === option.weeks && (
                          <div className="mt-2 text-xs font-medium">
                            Ends: {calculateEndDate(parseInt(option.weeks))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-foreground-500 bg-info/5 border border-info/20 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <span>💡</span>
                    <div>
                      <strong>How it works:</strong> Goal remains active for the selected duration.
                      Missed steps automatically carry over to the next day. Excess steps create credits
                      that reduce future targets.
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div className="space-y-2">
                <Textarea
                  label="Notes & Instructions"
                  placeholder="Add motivational notes, specific instructions, or context for this goal..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  classNames={{
                    input: "resize-none",
                  }}
                />
                <div className="text-xs text-foreground-500">
                  These notes will be visible to the user in their step tracking dashboard
                </div>
              </div>
            </div>
      </BottomSheet>

      {/* Edit Goal Modal */}
      <BottomSheet
        isOpen={isEditOpen}
        onClose={onEditClose}
        size="lg"
        title="Edit Step Goal"
        footer={
          <>
            <Button variant="ghost" onPress={onEditClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleUpdateGoal}
              isLoading={loading}
            >
              Update Goal
            </Button>
          </>
        }
      >
        {editingGoal && (
          <div className="space-y-4">
            <div className="p-3 bg-content2 rounded-lg">
              <h4 className="font-semibold mb-1">
                {editingGoal.userInfo?.username || editingGoal.userInfo?.firstName || editingGoal.userInfo?.email}
              </h4>
              <p className="text-sm text-foreground-500">{editingGoal.userInfo?.email}</p>
            </div>

            <Input
              type="number"
              label="Daily Step Target"
              value={dailyTarget}
              onChange={(e) => setDailyTarget(e.target.value)}
              endContent={<span className="text-foreground-500">steps</span>}
            />

            <DatePicker
              label="End Date (Optional)"
              value={endDate ? new Date(endDate) : undefined}
              onChange={(date) => setEndDate(date ? date.toISOString().split('T')[0] : '')}
            />

            <Textarea
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        )}
      </BottomSheet>
    </div>
  );
}