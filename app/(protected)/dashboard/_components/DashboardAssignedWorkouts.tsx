"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
import {
  IconBarbell,
  IconPlayerPlay,
  IconEye,
  IconCalendar,
  IconUser,
  IconClock,
} from "@tabler/icons-react";
import Link from "next/link";

interface AssignedWorkout {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
  assignedAt: string;
  dueDate?: string;
  notes?: string;
  workoutPlan: {
    id: string;
    name: string;
    notes?: string;
    systemRoutineCategory?: string;
    WorkoutPlanExercise: Array<{
      Exercise: {
        id: string;
        name: string;
        category: string;
        primary_muscles: string[];
        equipment: string;
      };
      sets: number;
      reps?: number;
      exerciseDuration?: number;
      order: number;
    }>;
  };
}

export default function DashboardAssignedWorkouts() {
  const [assignedWorkouts, setAssignedWorkouts] = useState<AssignedWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState<AssignedWorkout | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    fetchAssignedWorkouts();
  }, []);

  const fetchAssignedWorkouts = async () => {
    try {
      const response = await fetch("/api/user/assigned-workouts");
      if (response.ok) {
        const data = await response.json();
        setAssignedWorkouts(data.assignedWorkouts);
      }
    } catch (error) {
      console.error("Error fetching assigned workouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateWorkoutStatus = async (assignmentId: string, status: string) => {
    try {
      const response = await fetch("/api/user/assigned-workouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, status }),
      });

      if (response.ok) {
        await fetchAssignedWorkouts();
      }
    } catch (error) {
      console.error("Error updating workout status:", error);
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
      default:
        return "default";
    }
  };

  const viewWorkoutDetails = (workout: AssignedWorkout) => {
    setSelectedWorkout(workout);
    onOpen();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Assigned Workouts</h3>
        </CardHeader>
        <CardBody>
          <p className="text-center py-4">Loading assigned workouts...</p>
        </CardBody>
      </Card>
    );
  }

  if (assignedWorkouts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Assigned Workouts</h3>
        </CardHeader>
        <CardBody>
          <p className="text-center text-foreground-500 py-4">
            No workouts assigned to you yet.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex justify-between">
          <h3 className="text-lg font-semibold">Assigned Workouts</h3>
          <Chip variant="flat" color="primary">
            {assignedWorkouts.length} assigned
          </Chip>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {assignedWorkouts.map((workout) => (
              <div
                key={workout.id}
                className="p-4 border rounded-lg bg-content2/50"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {workout.workoutPlan.name}
                    </h4>
                    {workout.workoutPlan.systemRoutineCategory && (
                      <p className="text-sm text-foreground-500">
                        {workout.workoutPlan.systemRoutineCategory}
                      </p>
                    )}
                  </div>
                  <Chip
                    color={getStatusColor(workout.status)}
                    variant="flat"
                    size="sm"
                  >
                    {workout.status.replace("_", " ")}
                  </Chip>
                </div>

                <div className="flex items-center gap-4 text-sm text-foreground-500 mb-4">
                  <div className="flex items-center gap-1">
                    <IconBarbell size={16} />
                    <span>{workout.workoutPlan.WorkoutPlanExercise.length} exercises</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconCalendar size={16} />
                    <span>Assigned {new Date(workout.assignedAt).toLocaleDateString()}</span>
                  </div>
                  {workout.dueDate && (
                    <div className="flex items-center gap-1">
                      <IconClock size={16} />
                      <span>Due {new Date(workout.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {workout.notes && (
                  <div className="mb-4 p-3 bg-content1 rounded text-sm">
                    <p className="font-medium text-foreground-600 mb-1">Notes from trainer:</p>
                    <p className="text-foreground-500">{workout.notes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    color="primary"
                    startContent={<IconPlayerPlay size={16} />}
                    as={Link}
                    href={`/workout/${workout.workoutPlan.id}?assignmentId=${workout.id}`}
                    isDisabled={workout.status === "COMPLETED"}
                  >
                    {workout.status === "COMPLETED" ? "Completed" : "Start Workout"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    startContent={<IconEye size={16} />}
                    onPress={() => viewWorkoutDetails(workout)}
                  >
                    View Details
                  </Button>
                  {workout.status === "PENDING" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      color="primary"
                      onPress={() => updateWorkoutStatus(workout.id, "IN_PROGRESS")}
                    >
                      Mark as Started
                    </Button>
                  )}
                  {workout.status === "IN_PROGRESS" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      color="success"
                      onPress={() => updateWorkoutStatus(workout.id, "COMPLETED")}
                    >
                      Mark as Complete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Workout Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>
            {selectedWorkout?.workoutPlan.name}
          </ModalHeader>
          <ModalBody>
            {selectedWorkout && (
              <div className="space-y-4">
                {selectedWorkout.workoutPlan.systemRoutineCategory && (
                  <div>
                    <p className="text-sm text-foreground-500">Category</p>
                    <p className="font-medium">{selectedWorkout.workoutPlan.systemRoutineCategory}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-foreground-500 mb-2">Exercises ({selectedWorkout.workoutPlan.WorkoutPlanExercise.length})</p>
                  <div className="space-y-2">
                    {selectedWorkout.workoutPlan.WorkoutPlanExercise.map((exercise, index) => (
                      <div key={exercise.Exercise.id} className="p-3 bg-content2 rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{exercise.Exercise.name}</p>
                            <p className="text-sm text-foreground-500">
                              {exercise.Exercise.primary_muscles.join(", ")} • {exercise.Exercise.equipment}
                            </p>
                          </div>
                          <div className="text-right text-sm">
                            <p className="font-medium">
                              {exercise.sets} sets × {exercise.reps || exercise.exerciseDuration}
                              {exercise.exerciseDuration ? "s" : " reps"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedWorkout.notes && (
                  <div>
                    <p className="text-sm text-foreground-500 mb-2">Trainer Notes</p>
                    <div className="p-3 bg-content2 rounded">
                      <p>{selectedWorkout.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onPress={onClose}>
              Close
            </Button>
            {selectedWorkout && selectedWorkout.status !== "COMPLETED" && (
              <Button
                color="primary"
                startContent={<IconPlayerPlay size={16} />}
                as={Link}
                href={`/workout/${selectedWorkout.workoutPlan.id}?assignmentId=${selectedWorkout.id}`}
              >
                Start Workout
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}