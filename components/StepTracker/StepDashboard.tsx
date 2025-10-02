"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Progress,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
import DatePicker from "@/components/UI/DatePicker";
import {
  IconTrendingUp,
  IconTarget,
  IconActivity,
  IconCalendar,
  IconPlus,
  IconFlame,
  IconTrophy,
  IconChartBar,
} from "@tabler/icons-react";

interface StepData {
  activeGoal: {
    id: string;
    dailyTarget: number;
    startDate: string;
    endDate?: string;
    notes?: string;
  } | null;
  todayLog: {
    actualSteps: number;
    targetSteps: number;
    carryOverSteps: number;
    excessSteps: number;
    isCompleted: boolean;
  } | null;
  weeklyLogs: Array<{
    date: string;
    actualSteps: number;
    targetSteps: number;
    isCompleted: boolean;
  }>;
  weeklyProgress: {
    totalWeeklyTarget: number;
    actualStepsThisWeek: number;
    targetStepsThisWeek: number;
    daysCompleted: number;
    remainingDays: number;
    isOnTrack: boolean;
    currentWeekLogs: Array<{
      date: string;
      actualSteps: number;
      targetSteps: number;
      isCompleted: boolean;
    }>;
  } | null;
  stats: {
    totalStepsMonth: number;
    totalStepsWeek: number;
    avgStepsMonth: number;
    avgStepsWeek: number;
    completionRateMonth: number;
    completionRateWeek: number;
    completedDaysMonth: number;
    maxStepsDay: number;
    currentTarget: number;
  };
  streak: number;
}

export default function StepDashboard() {
  const [stepData, setStepData] = useState<StepData | null>(null);
  const [loading, setLoading] = useState(true);
  const [logSteps, setLogSteps] = useState("");
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    fetchStepData();
  }, []);

  const fetchStepData = async () => {
    try {
      const response = await fetch("/api/user/step-dashboard");
      const data = await response.json();
      setStepData(data);
    } catch (error) {
      console.error("Error fetching step data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogSteps = async () => {
    if (!logSteps || !logDate) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/user/step-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          steps: parseInt(logSteps),
          date: logDate,
        }),
      });

      if (response.ok) {
        await fetchStepData();
        setLogSteps("");
        onClose();
      }
    } catch (error) {
      console.error("Error logging steps:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!stepData) {
    return <div>Error loading step data</div>;
  }

  const { activeGoal, todayLog, weeklyLogs, weeklyProgress, stats, streak } = stepData;

  const todayProgress = todayLog
    ? Math.min((todayLog.actualSteps / todayLog.targetSteps) * 100, 100)
    : 0;

  const weeklyCompletionRate = weeklyLogs && weeklyLogs.length > 0
    ? (weeklyLogs.filter(log => log.isCompleted).length / weeklyLogs.length) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Step Tracking</h2>
          <p className="text-foreground-500">Track your daily steps and achieve your goals</p>
        </div>
        <Button
          color="primary"
          startContent={<IconPlus size={20} />}
          onPress={onOpen}
        >
          Log Steps
        </Button>
      </div>

      {!activeGoal ? (
        <Card shadow="none" className="shadow-md">
          <CardBody className="text-center p-8">
            <IconTarget size={48} className="text-zinc-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">No Active Step Goal</h3>
            <p className="text-foreground-500">
              Ask your trainer to assign you a daily step goal to get started!
            </p>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Today's Progress */}
          <Card shadow="none" className="shadow-md">
            <CardHeader className="px-3 text-xs uppercase block w-full truncate flex gap-3">
              <IconActivity size={22} className="text-primary" />
              Today's Progress
            </CardHeader>
            <CardBody className="px-3 pt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-4xl text-foreground">
                      {todayLog?.actualSteps.toLocaleString() || 0}
                    </p>
                    <p className="text-foreground-500">
                      of {todayLog?.targetSteps.toLocaleString() || activeGoal.dailyTarget.toLocaleString()} steps
                    </p>
                  </div>
                  <div className="text-right">
                    <Chip
                      color={todayLog?.isCompleted ? "success" : "primary"}
                      variant="flat"
                      size="lg"
                    >
                      {todayProgress.toFixed(1)}%
                    </Chip>
                  </div>
                </div>

                <Progress
                  value={todayProgress}
                  color={todayLog?.isCompleted ? "success" : "primary"}
                  size="lg"
                  className="mb-4"
                />

                {todayLog && (
                  <div className="grid grid-cols-3 gap-4 text-center">
                    {todayLog.carryOverSteps > 0 && (
                      <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                        <p className="text-sm text-warning font-medium">Carry-over</p>
                        <p className="text-lg font-bold text-warning">+{todayLog.carryOverSteps}</p>
                      </div>
                    )}
                    {todayLog.excessSteps > 0 && (
                      <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                        <p className="text-sm text-success font-medium">Credit</p>
                        <p className="text-lg font-bold text-success">-{todayLog.excessSteps}</p>
                      </div>
                    )}
                    {todayLog.isCompleted && (
                      <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                        <IconTrophy className="text-success mx-auto mb-1" size={20} />
                        <p className="text-sm text-success font-medium">Completed!</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card shadow="none" className="shadow-md">
              <CardHeader className="px-3 text-xs uppercase block w-full truncate flex gap-3">
                <IconFlame className="text-danger" size={22} />
                Streak
              </CardHeader>
              <CardBody className="px-3 text-4xl pt-0 text-foreground">
                {streak} days
              </CardBody>
            </Card>

            <Card shadow="none" className="shadow-md">
              <CardHeader className="px-3 text-xs uppercase block w-full truncate flex gap-3">
                <IconTrendingUp className="text-success" size={22} />
                Weekly Avg
              </CardHeader>
              <CardBody className="px-3 text-4xl pt-0 text-foreground">
                {stats.avgStepsWeek.toLocaleString()}
              </CardBody>
            </Card>

            <Card shadow="none" className="shadow-md">
              <CardHeader className="px-3 text-xs uppercase block w-full truncate flex gap-3">
                <IconTarget className="text-warning" size={22} />
                Week Rate
              </CardHeader>
              <CardBody className="px-3 text-4xl pt-0 text-foreground">
                {stats.completionRateWeek}%
              </CardBody>
            </Card>

            <Card shadow="none" className="shadow-md">
              <CardHeader className="px-3 text-xs uppercase block w-full truncate flex gap-3">
                <IconTrophy className="text-zinc-400" size={22} />
                Best Day
              </CardHeader>
              <CardBody className="px-3 text-4xl pt-0 text-foreground">
                {stats.maxStepsDay.toLocaleString()}
              </CardBody>
            </Card>
          </div>

          {/* Weekly Progress - Enhanced */}
          {weeklyProgress && (
            <Card shadow="none" className="shadow-md">
              <CardHeader className="px-3 text-xs uppercase block w-full truncate flex gap-3">
                <IconChartBar size={22} className="text-primary" />
                This Week's Progress
              </CardHeader>
              <CardBody className="px-3 pt-0">
                <div className="space-y-4">
                  {/* Weekly Summary */}
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="text-center">
                        <p className="text-xs text-foreground-500">Steps This Week</p>
                        <p className="text-xl font-bold text-primary">
                          {weeklyProgress.actualStepsThisWeek.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-foreground-500">Weekly Target</p>
                        <p className="text-xl font-bold text-foreground">
                          {weeklyProgress.totalWeeklyTarget.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <Progress
                      value={(weeklyProgress.actualStepsThisWeek / weeklyProgress.totalWeeklyTarget) * 100}
                      color={weeklyProgress.isOnTrack ? "success" : "warning"}
                      size="lg"
                      className="mb-3"
                    />

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${weeklyProgress.isOnTrack ? 'bg-success' : 'bg-warning'}`}></span>
                        <span className="text-foreground-500">
                          {weeklyProgress.isOnTrack ? 'On Track' : 'Behind Schedule'}
                        </span>
                      </div>
                      <span className="font-medium">
                        {weeklyProgress.remainingDays} days left
                      </span>
                    </div>

                    {weeklyProgress.remainingDays === 1 && (
                      <div className="mt-3 p-2 bg-warning/10 border border-warning/30 rounded text-center">
                        <p className="text-sm font-medium text-warning">
                          🎯 Last day! Complete {(weeklyProgress.totalWeeklyTarget - weeklyProgress.actualStepsThisWeek).toLocaleString()} steps to reach your weekly goal!
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Daily Breakdown */}
                  <div>
                    <p className="text-sm font-medium text-foreground-500 mb-2">Daily Breakdown</p>
                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: 7 }, (_, i) => {
                        const date = new Date();
                        const startOfWeek = new Date(date);
                        startOfWeek.setDate(date.getDate() - date.getDay());
                        startOfWeek.setDate(startOfWeek.getDate() + i);

                        const dayLog = weeklyProgress.currentWeekLogs.find(log =>
                          new Date(log.date).toDateString() === startOfWeek.toDateString()
                        );

                        const dayName = startOfWeek.toLocaleDateString('en-US', { weekday: 'short' });
                        const isToday = startOfWeek.toDateString() === new Date().toDateString();
                        const isFuture = startOfWeek > new Date();

                        return (
                          <div key={i} className="text-center">
                            <div className={`text-xs mb-1 ${isToday ? 'text-primary font-bold' : 'text-foreground-500'}`}>
                              {dayName}
                            </div>
                            <div
                              className={`h-12 rounded-lg flex items-center justify-center text-xs font-medium border-2 ${
                                isFuture
                                  ? "bg-default-50 border-default-200 text-foreground-400"
                                  : dayLog?.isCompleted
                                  ? "bg-success border-success text-white"
                                  : dayLog
                                  ? "bg-warning border-warning text-white"
                                  : "bg-default-100 border-default-300 text-foreground-500"
                              } ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                            >
                              {isFuture ? '—' : dayLog ? Math.round((dayLog.actualSteps / dayLog.targetSteps) * 100) + '%' : '0%'}
                            </div>
                            <div className="text-xs text-foreground-400 mt-1">
                              {isFuture ? '' : dayLog ? dayLog.actualSteps.toLocaleString() : '0'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Last 7 Days (fallback if no weekly progress) */}
          {!weeklyProgress && (
            <Card shadow="none" className="shadow-md">
              <CardHeader className="px-3 text-xs uppercase block w-full truncate flex gap-3">
                <IconChartBar size={22} className="text-primary" />
                Last 7 Days
              </CardHeader>
              <CardBody className="px-3 pt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-foreground-500">Weekly completion rate</p>
                    <Chip color={weeklyCompletionRate >= 70 ? "success" : "warning"} variant="flat">
                      {weeklyCompletionRate.toFixed(1)}%
                    </Chip>
                  </div>
                  <Progress
                    value={weeklyCompletionRate}
                    color={weeklyCompletionRate >= 70 ? "success" : "warning"}
                    size="md"
                  />
                  <div className="grid grid-cols-7 gap-2">
                    {weeklyLogs && weeklyLogs.length > 0 && weeklyLogs.map((log, index) => {
                      if (!log) return null;
                      const date = new Date(log.date);
                      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                      const progress = log.targetSteps > 0 ? (log.actualSteps / log.targetSteps) * 100 : 0;

                      return (
                        <div key={index} className="text-center">
                          <div className="text-xs text-foreground-500 mb-1">{dayName}</div>
                          <div
                            className={`h-12 rounded-lg flex items-center justify-center text-xs font-medium ${
                              log.isCompleted
                                ? "bg-success text-white"
                                : progress > 50
                                ? "bg-warning text-white"
                                : "bg-default-100 text-foreground-500"
                            }`}
                          >
                            {Math.round(progress)}%
                          </div>
                          <div className="text-xs text-foreground-400 mt-1">
                            {log.actualSteps.toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Goal Info */}
          <Card shadow="none" className="shadow-md">
            <CardHeader className="px-3 text-xs uppercase block w-full truncate flex gap-3">
              <IconTarget size={22} className="text-primary" />
              Current Goal
            </CardHeader>
            <CardBody className="px-3 pt-0">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-foreground-500">Daily Target:</span>
                  <span className="font-semibold text-foreground">{activeGoal.dailyTarget.toLocaleString()} steps</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-500">Started:</span>
                  <span className="font-semibold text-foreground">
                    {new Date(activeGoal.startDate).toLocaleDateString()}
                  </span>
                </div>
                {activeGoal.endDate && (
                  <div className="flex justify-between">
                    <span className="text-foreground-500">Ends:</span>
                    <span className="font-semibold text-foreground">
                      {new Date(activeGoal.endDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {activeGoal.notes && (
                  <div>
                    <p className="text-foreground-500 mb-1">Notes:</p>
                    <p className="text-sm bg-default-100 p-3 rounded-lg text-foreground-600">{activeGoal.notes}</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </>
      )}

      {/* Log Steps Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>Log Steps</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                type="number"
                label="Steps Count"
                placeholder="e.g., 8500"
                value={logSteps}
                onChange={(e) => setLogSteps(e.target.value)}
                endContent={<span className="text-foreground-500">steps</span>}
              />
              <DatePicker
                label="Date"
                value={logDate ? new Date(logDate) : undefined}
                onChange={(date) => setLogDate(date ? date.toISOString().split('T')[0] : '')}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleLogSteps}
              isLoading={submitting}
              isDisabled={!logSteps}
            >
              Log Steps
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}