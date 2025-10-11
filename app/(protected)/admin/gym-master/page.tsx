"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRestTimer } from "@/contexts/RestTimerContext";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Button, ButtonGroup } from "@nextui-org/button";
import { Chip } from "@nextui-org/chip";
import { Input } from "@nextui-org/input";
import { Switch } from "@nextui-org/switch";
import { Progress } from "@nextui-org/progress";
import { Tabs, Tab } from "@nextui-org/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@nextui-org/table";
import {
  IconClock,
  IconClockPause,
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerStop,
  IconPlus,
  IconUsers,
  IconSettings,
  IconRefresh,
} from "@tabler/icons-react";

export default function GymMasterPage() {
  const { userId } = useAuth();
  const restTimer = useRestTimer();

  // Gym session state
  const [gymSessionName, setGymSessionName] = useState("");
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Enable gym master mode when component mounts
  useEffect(() => {
    restTimer.setGymMasterMode(true);
    return () => {
      // Cleanup: disable gym master mode when leaving
      restTimer.setGymMasterMode(false);
    };
  }, []);

  // Get all active sessions
  const allActiveSessions = restTimer.getAllActiveSessions();
  const activeRestTimers = Array.from(restTimer.activeRestTimers.values());

  // Mock data for demonstration (in real app, this would come from API)
  const mockUsers = [
    { id: "user1", name: "John Doe", email: "john@example.com" },
    { id: "user2", name: "Jane Smith", email: "jane@example.com" },
    { id: "user3", name: "Mike Johnson", email: "mike@example.com" },
  ];

  const createGymSession = () => {
    if (!gymSessionName.trim()) return;

    setIsCreatingSession(true);
    // In a real app, this would create a gym session via API
    setTimeout(() => {
      const sessionId = `gym-session-${Date.now()}`;
      restTimer.setCurrentGymSessionId(sessionId);
      setGymSessionName("");
      setIsCreatingSession(false);
    }, 1000);
  };

  const endGymSession = () => {
    restTimer.setCurrentGymSessionId(null);
    // End all user sessions
    allActiveSessions.forEach(session => {
      restTimer.endUserWorkoutSession(session.userId);
    });
  };

  const startUserWorkout = (userId: string, userName: string) => {
    const workoutSessionId = `workout-${userId}-${Date.now()}`;
    restTimer.startUserWorkoutSession(userId, userName, workoutSessionId);
  };

  const stopUserTimer = (timerId: string) => {
    restTimer.stopRestTimer(timerId);
  };

  const extendUserTimer = (timerId: string, seconds: number) => {
    restTimer.extendRestTimer(timerId, seconds);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Gym Master Dashboard</h1>
        <p className="text-default-500">
          Manage multiple user workout sessions and timers
        </p>
      </div>

      <Tabs defaultSelectedKey="overview" className="mb-6">
        <Tab key="overview" title={
          <div className="flex items-center gap-2">
            <IconClock size={16} />
            Overview
          </div>
        }>
          {/* Overview Tab */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gym Session Control */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Gym Session</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                {!restTimer.currentGymSessionId ? (
                  <div className="space-y-3">
                    <Input
                      label="Session Name"
                      placeholder="Morning Session"
                      value={gymSessionName}
                      onChange={(e) => setGymSessionName(e.target.value)}
                    />
                    <Button
                      color="primary"
                      fullWidth
                      isLoading={isCreatingSession}
                      onPress={createGymSession}
                      disabled={!gymSessionName.trim()}
                    >
                      Start Gym Session
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Chip color="success" variant="flat">
                      Session Active
                    </Chip>
                    <p className="text-sm text-default-500">
                      Session ID: {restTimer.currentGymSessionId}
                    </p>
                    <Button
                      color="danger"
                      variant="flat"
                      fullWidth
                      onPress={endGymSession}
                    >
                      End Session
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Quick Stats</h3>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {allActiveSessions.length}
                    </div>
                    <div className="text-sm text-default-500">Active Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warning">
                      {activeRestTimers.length}
                    </div>
                    <div className="text-sm text-default-500">Rest Timers</div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Audio Settings */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Settings</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Audio Notifications</span>
                  <Switch
                    isSelected={restTimer.enableAudio}
                    onValueChange={restTimer.setEnableAudio}
                  />
                </div>
                <Button
                  variant="flat"
                  size="sm"
                  startContent={<IconRefresh size={16} />}
                  onPress={() => window.location.reload()}
                >
                  Refresh Dashboard
                </Button>
              </CardBody>
            </Card>
          </div>

          {/* Active Workout Sessions */}
          <Card className="mt-6">
            <CardHeader>
              <h3 className="text-lg font-semibold">Active Workout Sessions</h3>
            </CardHeader>
            <CardBody>
              {allActiveSessions.length === 0 ? (
                <div className="text-center py-8">
                  <IconUsers size={48} className="mx-auto mb-4 text-default-300" />
                  <p className="text-default-500">No active workout sessions</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {allActiveSessions.map((session) => (
                    <Card key={session.userId} className="border">
                      <CardBody className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{session.userName}</h4>
                            <p className="text-sm text-default-500">
                              {session.userId}
                            </p>
                          </div>
                          <Chip
                            color={
                              session.status === "RESTING"
                                ? "warning"
                                : session.status === "ACTIVE"
                                ? "success"
                                : "default"
                            }
                            size="sm"
                          >
                            {session.status}
                          </Chip>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Workout Time:</span>
                            <span className="font-mono">
                              {restTimer.formatTime(session.totalWorkoutDuration)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Rest Time:</span>
                            <span className="font-mono">
                              {restTimer.formatTime(session.totalRestTime)}
                            </span>
                          </div>
                        </div>

                        {session.restTimer && (
                          <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">Rest Timer</span>
                              <span className="text-sm font-mono">
                                {restTimer.formatTime(session.restTimer.duration)} /
                                {restTimer.formatTime(session.restTimer.targetDuration)}
                              </span>
                            </div>
                            <Progress
                              value={
                                (session.restTimer.duration / session.restTimer.targetDuration) * 100
                              }
                              color="warning"
                              size="sm"
                              className="mb-2"
                            />
                            <p className="text-xs text-default-500">
                              {session.restTimer.exerciseName} - Set {session.restTimer.setNumber}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2 mt-3">
                          {session.restTimer && (
                            <>
                              <Button
                                size="sm"
                                variant="flat"
                                color="success"
                                onPress={() => stopUserTimer(session.restTimer!.id)}
                              >
                                <IconPlayerStop size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="flat"
                                color="secondary"
                                onPress={() => extendUserTimer(session.restTimer!.id, 30)}
                              >
                                +30s
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="flat"
                            color="danger"
                            onPress={() => restTimer.endUserWorkoutSession(session.userId)}
                          >
                            End Workout
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </Tab>

        <Tab key="users" title={
          <div className="flex items-center gap-2">
            <IconUsers size={16} />
            User Management
          </div>
        }>
          {/* User Management Tab */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Available Users</h3>
            </CardHeader>
            <CardBody>
              <Table aria-label="User management table">
                <TableHeader>
                  <TableColumn>Name</TableColumn>
                  <TableColumn>Email</TableColumn>
                  <TableColumn>Status</TableColumn>
                  <TableColumn>Actions</TableColumn>
                </TableHeader>
                <TableBody>
                  {mockUsers.map((user) => {
                    const userSession = allActiveSessions.find(s => s.userId === user.id);
                    return (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            color={userSession ? "success" : "default"}
                            size="sm"
                          >
                            {userSession ? "Working Out" : "Available"}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          {!userSession ? (
                            <Button
                              size="sm"
                              color="primary"
                              onPress={() => startUserWorkout(user.id, user.name)}
                            >
                              Start Workout
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              color="danger"
                              variant="flat"
                              onPress={() => restTimer.endUserWorkoutSession(user.id)}
                            >
                              End Session
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
}