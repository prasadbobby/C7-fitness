"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
} from "@nextui-org/react";
import {
  IconJumpRope,
  IconCalendar,
  IconUser,
  IconBarbell,
  IconChevronRight,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AssignedWorkout {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED" | "ABSENT";
  assignedAt: string;
  dueDate?: string;
  notes?: string;
  workoutPlan: {
    id: string;
    name: string;
    _count: {
      WorkoutPlanExercise: number;
    };
  };
}

interface UserInfo {
  id: string;
  userId: string;
  displayName: string;
  imageUrl?: string;
}

interface AssignedWorkoutsData {
  user: UserInfo;
  assignedWorkouts: AssignedWorkout[];
}

export default function UserAssignedWorkouts() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<AssignedWorkoutsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignedWorkouts();
  }, [id]);

  const fetchAssignedWorkouts = async () => {
    try {
      const response = await fetch(`/api/admin/users/${id}/assigned-workouts`);
      if (!response.ok) {
        throw new Error(`Failed to fetch assigned workouts: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching assigned workouts:", error);
      setData(null);
    } finally {
      setLoading(false);
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

  const handleStartWorkout = (workoutPlanId: string, assignmentId: string) => {
    const url = `/workout/${workoutPlanId}?adminMode=true&targetUserId=${data?.user.userId}&targetUserDbId=${data?.user.id}&assignmentId=${assignmentId}`;
    router.push(url);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!data) {
    return <div>User not found or no data available</div>;
  }

  const { user, assignedWorkouts } = data;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-foreground-500">
        <Link href="/admin/users" className="hover:text-foreground-700">
          Users
        </Link>
        <IconChevronRight size={16} />
        <Link href={`/admin/users/${id}/progress`} className="hover:text-foreground-700">
          {user?.displayName || 'User'}
        </Link>
        <IconChevronRight size={16} />
        <span className="text-foreground-900 font-medium">Assigned Workouts</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Assigned Workouts</h1>
        <p className="text-foreground-500 mt-2">
          Select a workout to start for {user?.displayName}
        </p>
      </div>

      {/* User Info Card */}
      <Card>
        <CardBody className="p-6">
          <div className="flex items-center gap-4">
            {user?.imageUrl && (
              <img
                src={user.imageUrl}
                alt="User avatar"
                className="w-12 h-12 rounded-full"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">
                  {user?.displayName}
                </h2>
                <IconUser size={16} className="text-foreground-500" />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Assigned Workouts */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Available Workouts</h2>

        {assignedWorkouts.length === 0 ? (
          <Card>
            <CardBody className="p-8 text-center">
              <div className="text-foreground-500">
                <IconBarbell size={48} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Assigned Workouts</h3>
                <p>This user doesn't have any assigned workouts yet.</p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedWorkouts.map((assignment) => (
              <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start w-full">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{assignment.workoutPlan.name}</h3>
                      <p className="text-sm text-foreground-500">
                        {assignment.workoutPlan._count.WorkoutPlanExercise} exercises
                      </p>
                    </div>
                    <Chip
                      color={getStatusColor(assignment.status)}
                      variant="flat"
                      size="sm"
                    >
                      {assignment.status}
                    </Chip>
                  </div>
                </CardHeader>
                <CardBody className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-foreground-500">
                      <IconCalendar size={16} />
                      <span>Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}</span>
                    </div>

                    {assignment.dueDate && (
                      <div className="flex items-center gap-2 text-sm text-foreground-500">
                        <IconCalendar size={16} />
                        <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}

                    {assignment.notes && (
                      <div className="text-sm text-foreground-600 bg-default-100 p-3 rounded-lg">
                        <strong>Notes:</strong> {assignment.notes}
                      </div>
                    )}

                    <Button
                      color="primary"
                      startContent={<IconJumpRope size={16} />}
                      onPress={() => handleStartWorkout(assignment.workoutPlan.id, assignment.id)}
                      className="w-full"
                      isDisabled={assignment.status === "COMPLETED"}
                    >
                      {assignment.status === "COMPLETED" ? "Completed" : "Start Workout"}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}