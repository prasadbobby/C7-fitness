"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Button,
  Chip,
  Progress,
  Tabs,
  Tab,
  Divider,
  useDisclosure,
} from "@nextui-org/react";
import {
  IconUser,
  IconCalendar,
  IconBarbell,
  IconTarget,
  IconTrendingUp,
  IconArrowLeft,
  IconUserX,
  IconSquareCheck,
  IconClock,
  IconPlayerSkipForward,
  IconEdit,
  IconDeviceFloppy,
  IconX,
  IconPlus,
  IconMinus,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import Link from "next/link";
import BottomSheet from "@/components/UI/BottomSheet";
import DatePicker from "@/components/UI/DatePicker";
import { Input, Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, ButtonGroup } from "@nextui-org/react";
import { toast } from "sonner";

interface UserProgress {
  user: {
    id: string;
    userId: string;
    username?: string;
    firstName?: string;
    email?: string;
    imageUrl?: string;
    age?: number;
    height?: number;
    weight?: number;
    role: string;
  };
  assignments: {
    id: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED" | "ABSENT";
    assignedAt: string;
    dueDate?: string;
    notes?: string;
    workoutPlan: {
      name: string;
      systemRoutineCategory?: string;
    };
  }[];
  workoutLogs: {
    id: string;
    date: string;
    duration: number;
    WorkoutPlan: {
      name: string;
    };
    exercises: {
      id: string;
      exerciseId: string;
      trackingType: "reps" | "duration";
      Exercise: {
        name: string;
      };
      sets: {
        id: string;
        weight?: number;
        reps?: number;
        exerciseDuration?: number;
      }[];
    }[];
  }[];
  stats: {
    totalAssignments: number;
    completedAssignments: number;
    absentCount: number;
    skippedCount: number;
    completionRate: number;
    avgWorkoutDuration: number;
    totalWorkouts: number;
    streakDays: number;
  };
}

interface AttendanceData {
  date: string;
  status: "completed" | "absent" | "pending" | "skipped" | "rest";
  dayOfWeek: number;
  dayNumber: number;
  monthName: string;
}

export default function UserProgressDashboard() {
  const params = useParams();
  const id = params.id as string;

  const [progressData, setProgressData] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Edit workout states
  const [editingWorkout, setEditingWorkout] = useState<any>(null);
  const [editWorkoutDate, setEditWorkoutDate] = useState<Date | undefined>(undefined);
  const [editWorkoutDuration, setEditWorkoutDuration] = useState("");
  const [editWorkoutSets, setEditWorkoutSets] = useState<any[][]>([]);
  const [editLoading, setEditLoading] = useState(false);

  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();

  // Month navigation functions
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  useEffect(() => {
    fetchUserProgress();
  }, [id]);

  // Regenerate attendance data when month changes
  useEffect(() => {
    if (progressData) {
      generateAttendanceData(progressData);
    }
  }, [currentMonth, progressData]);

  const fetchUserProgress = async () => {
    try {
      const response = await fetch(`/api/admin/users/${id}/progress`);
      if (!response.ok) {
        throw new Error(`Failed to fetch user progress: ${response.status}`);
      }
      const data = await response.json();
      setProgressData(data);
      generateAttendanceData(data);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      setProgressData(null);
    } finally {
      setLoading(false);
    }
  };

  const generateAttendanceData = (data: UserProgress) => {
    // Generate days for the current selected month
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Get first and last day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, month, i + 1);
      return date.toISOString().split('T')[0];
    });

    const attendanceMap = new Map();

    // Mark completed workouts
    data.workoutLogs?.forEach(log => {
      const logDate = new Date(log.date).toISOString().split('T')[0];
      attendanceMap.set(logDate, 'completed');
    });

    // Mark absent days from assignments
    data.assignments?.forEach(assignment => {
      if (assignment.status === 'ABSENT' && assignment.dueDate) {
        const dueDate = new Date(assignment.dueDate).toISOString().split('T')[0];
        attendanceMap.set(dueDate, 'absent');
      } else if (assignment.status === 'SKIPPED' && assignment.dueDate) {
        const dueDate = new Date(assignment.dueDate).toISOString().split('T')[0];
        attendanceMap.set(dueDate, 'skipped');
      }
    });

    const attendance = monthDays.map(date => {
      const dateObj = new Date(date);
      const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayNumber = dateObj.getDate();
      const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });

      let status = attendanceMap.get(date) || 'pending';

      // Mark Sundays as rest day
      if (dayOfWeek === 0) {
        status = 'rest';
      }

      return {
        date,
        status: status as "completed" | "absent" | "pending" | "skipped" | "rest",
        dayOfWeek,
        dayNumber,
        monthName
      };
    });

    setAttendanceData(attendance);
  };

  const handleEditWorkout = (workout: any) => {
    setEditingWorkout(workout);
    setEditWorkoutDate(new Date(workout.date));
    setEditWorkoutDuration(workout.duration.toString());
    setEditWorkoutSets(workout.exercises.map((exercise: any) => exercise.sets));
    onEditOpen();
  };

  const handleSetChange = (
    exerciseIndex: number,
    setIndex: number,
    field: string,
    value: number | null,
  ) => {
    const newSets = [...editWorkoutSets];
    newSets[exerciseIndex][setIndex][field] = value;
    setEditWorkoutSets(newSets);
  };

  const handleAddSet = (exerciseIndex: number) => {
    const newSets = [...editWorkoutSets];
    newSets[exerciseIndex].push({
      weight: null,
      reps: null,
      exerciseDuration: null,
    });
    setEditWorkoutSets(newSets);
  };

  const handleRemoveSet = (exerciseIndex: number) => {
    const newSets = [...editWorkoutSets];
    if (newSets[exerciseIndex].length > 1) {
      newSets[exerciseIndex].pop();
      setEditWorkoutSets(newSets);
    } else {
      toast.error("Cannot remove all sets");
    }
  };

  const handleSaveWorkout = async () => {
    if (!editingWorkout || !editWorkoutDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setEditLoading(true);
    try {
      const durationMinutes = parseInt(editWorkoutDuration) || 0;
      const payload = {
        date: editWorkoutDate.toISOString(),
        duration: durationMinutes, // Duration is stored in minutes, not seconds
        exercises: editingWorkout.exercises.map((exercise: any, index: number) => ({
          id: exercise.id,
          sets: editWorkoutSets[index] || [],
        })),
      };

      console.log("Sending payload to API:", JSON.stringify(payload, null, 2));

      const response = await fetch(`/api/admin/workout-logs/${editingWorkout.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Workout updated successfully");
        onEditClose();
        fetchUserProgress();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", response.status, errorData);
        toast.error(`Failed to update workout: ${errorData.error || response.status}`);
      }
    } catch (error) {
      console.error("Error updating workout:", error);
      toast.error("Failed to update workout");
    } finally {
      setEditLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "warning";
      case "IN_PROGRESS": return "primary";
      case "COMPLETED": return "success";
      case "SKIPPED": return "danger";
      case "ABSENT": return "secondary";
      default: return "default";
    }
  };

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success";
      case "absent": return "bg-danger";
      case "skipped": return "bg-warning";
      case "rest": return "bg-blue-500";
      case "pending": return "bg-default-200";
      default: return "bg-default-100";
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!progressData) {
    return <div>User not found</div>;
  }

  const { user, assignments, workoutLogs, stats } = progressData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          as={Link}
          href="/admin/users"
          variant="ghost"
          startContent={<IconArrowLeft size={16} />}
        >
          Back to Users
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Progress Dashboard</h1>
          <p className="text-foreground-500 mt-2">
            Comprehensive tracking for {user?.username || user?.firstName || user?.email || user?.userId}
          </p>
        </div>
      </div>

      {/* User Info Card */}
      <Card>
        <CardBody className="p-6">
          <div className="flex items-center gap-4">
            {user?.imageUrl && (
              <img
                src={user.imageUrl}
                alt="User avatar"
                className="w-16 h-16 rounded-full"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold">
                  {user?.username || user?.firstName || user?.email || user?.userId}
                </h2>
                <Chip color={user?.role === "ADMIN" ? "warning" : "primary"} size="sm">
                  {user?.role || 'USER'}
                </Chip>
              </div>
              <div className="flex gap-6 text-sm text-foreground-500">
                {user?.age && <span>Age: {user.age}</span>}
                {user?.height && <span>Height: {user.height}cm</span>}
                {user?.weight && <span>Weight: {user.weight}kg</span>}
              </div>
              <div className="text-xs text-foreground-400 mt-1">
                User ID: {user?.userId}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <IconTarget size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-foreground-500">Total Assignments</p>
                <p className="text-lg font-bold text-foreground">{stats?.totalAssignments || 0}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <IconSquareCheck size={20} className="text-success" />
              </div>
              <div>
                <p className="text-xs text-foreground-500">Completed</p>
                <p className="text-lg font-bold text-foreground">{stats?.completedAssignments || 0}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-danger/10 rounded-lg">
                <IconUserX size={20} className="text-danger" />
              </div>
              <div>
                <p className="text-xs text-foreground-500">Absent</p>
                <p className="text-lg font-bold text-foreground">{stats?.absentCount || 0}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <IconPlayerSkipForward size={20} className="text-warning" />
              </div>
              <div>
                <p className="text-xs text-foreground-500">Skipped</p>
                <p className="text-lg font-bold text-foreground">{stats?.skippedCount || 0}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <IconTrendingUp size={20} className="text-success" />
              </div>
              <div>
                <p className="text-xs text-foreground-500">Completion Rate</p>
                <p className="text-lg font-bold text-foreground">{stats?.completionRate || 0}%</p>
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
                <p className="text-xs text-foreground-500">Total Workouts</p>
                <p className="text-lg font-bold text-foreground">{stats?.totalWorkouts || 0}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <IconClock size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-foreground-500">Avg Duration</p>
                <p className="text-lg font-bold text-foreground">{stats?.avgWorkoutDuration || 0}min</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <IconCalendar size={20} className="text-success" />
              </div>
              <div>
                <p className="text-xs text-foreground-500">Streak</p>
                <p className="text-lg font-bold text-foreground">{stats?.streakDays || 0} days</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Attendance Calendar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between px-6">
          <h3 className="text-lg font-semibold">Monthly Attendance</h3>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              isIconOnly
              onPress={goToPreviousMonth}
              title="Previous Month"
            >
              <IconChevronLeft size={16} />
            </Button>
            <div className="text-sm font-medium min-w-[120px] text-center">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <Button
              size="sm"
              variant="ghost"
              isIconOnly
              onPress={goToNextMonth}
              title="Next Month"
            >
              <IconChevronRight size={16} />
            </Button>
            <Button
              size="sm"
              variant="flat"
              startContent={<IconCalendar size={14} />}
              onPress={goToCurrentMonth}
              title="Go to Current Month"
            >
              Today
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-foreground-600 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }, (_, i) => (
                <div key={`empty-${i}`} className="h-10"></div>
              ))}

              {attendanceData.map((day, index) => (
                <div key={index} className="text-center">
                  <div
                    className={`w-10 h-10 rounded-lg ${getAttendanceColor(day.status)} border border-divider flex items-center justify-center relative`}
                    title={`${day.date}: ${day.status}${day.dayOfWeek === 0 ? ' (Rest Day - Sunday)' : ''}`}
                  >
                    <span className="text-xs font-medium">
                      {day.dayNumber}
                    </span>
                    {day.dayOfWeek === 0 && (
                      <span className="absolute -top-1 -right-1 text-white text-xs font-bold bg-blue-600 rounded-full w-4 h-4 flex items-center justify-center">
                        R
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-success rounded" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-danger rounded" />
                <span>Absent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-warning rounded" />
                <span>Skipped</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded" />
                <span>Rest Day (Sunday)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-default-200 rounded" />
                <span>No Assignment</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tabs for detailed data */}
      <Tabs aria-label="Progress details">
        <Tab key="assignments" title="Assignments">
          <Card>
            <CardBody>
              <div className="space-y-4">
                {(assignments?.length || 0) === 0 ? (
                  <p className="text-center text-foreground-500">No assignments found</p>
                ) : (
                  assignments?.map((assignment) => (
                    <div key={assignment.id} className="p-4 border border-divider rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{assignment.workoutPlan.name}</h4>
                          {assignment.workoutPlan.systemRoutineCategory && (
                            <p className="text-sm text-foreground-500">
                              {assignment.workoutPlan.systemRoutineCategory}
                            </p>
                          )}
                        </div>
                        <Chip color={getStatusColor(assignment.status)} variant="flat" size="sm">
                          {assignment.status}
                        </Chip>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-foreground-500">
                        <div>
                          <span>Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}</span>
                        </div>
                        {assignment.dueDate && (
                          <div>
                            <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      {assignment.notes && (
                        <div className="mt-2 text-sm text-foreground-600">
                          <strong>Notes:</strong> {assignment.notes}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="workouts" title="Workout History">
          <Card>
            <CardBody>
              <div className="space-y-4">
                {(workoutLogs?.length || 0) === 0 ? (
                  <p className="text-center text-foreground-500">No workout history found</p>
                ) : (
                  workoutLogs?.map((log) => (
                    <div key={log.id} className="p-4 border border-divider rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{log.WorkoutPlan.name}</h4>
                          <p className="text-sm text-foreground-500">
                            {new Date(log.date).toLocaleDateString()} • {log.duration} minutes
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="flat"
                          startContent={<IconEdit size={14} />}
                          onPress={() => handleEditWorkout(log)}
                        >
                          Edit
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Exercises completed:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {log.exercises.map((exercise, index) => (
                            <div key={index} className="text-sm p-2 bg-content2 rounded">
                              <div className="font-medium">{exercise.Exercise.name}</div>
                              <div className="text-xs text-foreground-500">
                                {exercise.sets.length} sets completed
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>

      {/* Edit Workout Modal */}
      <BottomSheet
        isOpen={isEditOpen}
        onClose={onEditClose}
        title="Edit Workout"
        size="5xl"
        footer={
          <>
            <Button variant="ghost" onPress={onEditClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSaveWorkout} isLoading={editLoading}>
              <IconDeviceFloppy size={16} />
              Save Changes
            </Button>
          </>
        }
      >
        {editingWorkout && (
          <div className="space-y-6">
            {/* Date and Duration */}
            <Card>
              <CardHeader className="text-lg px-4">Date & Duration</CardHeader>
              <CardBody className="grid grid-cols-2 gap-4 px-4 pt-0">
                <Input
                  type="number"
                  label="Duration (Minutes)"
                  value={editWorkoutDuration}
                  onChange={(e) => setEditWorkoutDuration(e.target.value)}
                />
                <DatePicker
                  label="Date"
                  value={editWorkoutDate}
                  onChange={setEditWorkoutDate}
                />
              </CardBody>
            </Card>

            {/* Exercises */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {editingWorkout.exercises.map((exercise: any, exerciseIndex: number) => (
                <Card key={exercise.id}>
                  <CardHeader className="text-lg px-4">{exercise.Exercise.name}</CardHeader>
                  <CardBody className="pt-0 px-4">
                    <Table removeWrapper shadow="none">
                      <TableHeader>
                        <TableColumn>SET</TableColumn>
                        <TableColumn>WEIGHT</TableColumn>
                        <TableColumn>
                          {exercise.trackingType === "reps" ? "REPS" : "DURATION"}
                        </TableColumn>
                      </TableHeader>
                      <TableBody>
                        {editWorkoutSets[exerciseIndex]?.map((set: any, setIndex: number) => (
                          <TableRow key={setIndex}>
                            <TableCell>{setIndex + 1}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                placeholder="0"
                                size="sm"
                                value={set.weight?.toString() || ""}
                                onChange={(e) =>
                                  handleSetChange(
                                    exerciseIndex,
                                    setIndex,
                                    "weight",
                                    parseFloat(e.target.value) || null
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                placeholder="0"
                                size="sm"
                                value={
                                  exercise.trackingType === "reps"
                                    ? set.reps?.toString() || ""
                                    : set.exerciseDuration?.toString() || ""
                                }
                                onChange={(e) =>
                                  handleSetChange(
                                    exerciseIndex,
                                    setIndex,
                                    exercise.trackingType === "reps" ? "reps" : "exerciseDuration",
                                    parseFloat(e.target.value) || null
                                  )
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardBody>
                  <CardFooter className="gap-2 px-4 bg-default-100">
                    <ButtonGroup>
                      <Button
                        size="sm"
                        onClick={() => handleAddSet(exerciseIndex)}
                        startContent={<IconPlus size={14} />}
                      >
                        Add Set
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleRemoveSet(exerciseIndex)}
                        startContent={<IconMinus size={14} />}
                      >
                        Remove Set
                      </Button>
                    </ButtonGroup>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}