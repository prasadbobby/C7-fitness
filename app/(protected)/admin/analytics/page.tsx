import { Card, CardBody, CardHeader, Chip, Progress } from "@nextui-org/react";
import {
  IconTrendingUp,
  IconUsers,
  IconBarbell,
  IconTarget,
  IconCalendar,
  IconFlame,
  IconChartBar,
  IconChartAreaFilled,
  IconChartLine,
  IconChartPie,
} from "@tabler/icons-react";
import prisma from "@/prisma/prisma";
import { Suspense } from "react";
import clsx from "clsx";

async function getChartData() {
  // Get workout frequency data for last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const workoutsByDay = await prisma.workoutLog.groupBy({
    by: ['createdAt'],
    where: {
      createdAt: {
        gte: thirtyDaysAgo,
      },
      inProgress: false,
    },
    _count: {
      id: true,
    },
  });

  // Get user registrations over time (last 30 days)
  const usersByDay = await prisma.userInfo.groupBy({
    by: ['createdAt'],
    where: {
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    _count: {
      id: true,
    },
  });

  // Get workout completion rates by week
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const twentyOneDaysAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);

  const [thisWeek, lastWeek, twoWeeksAgo, threeWeeksAgo] = await Promise.all([
    prisma.workoutLog.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
        inProgress: false,
      },
    }),
    prisma.workoutLog.count({
      where: {
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
        inProgress: false,
      },
    }),
    prisma.workoutLog.count({
      where: {
        createdAt: { gte: twentyOneDaysAgo, lt: fourteenDaysAgo },
        inProgress: false,
      },
    }),
    prisma.workoutLog.count({
      where: {
        createdAt: { gte: thirtyDaysAgo, lt: twentyOneDaysAgo },
        inProgress: false,
      },
    }),
  ]);

  return {
    workoutFrequency: [threeWeeksAgo, twoWeeksAgo, lastWeek, thisWeek],
    userGrowth: usersByDay,
    dailyWorkouts: workoutsByDay,
  };
}

async function getAnalyticsData() {
  const [
    totalUsers,
    activeUsers,
    totalWorkouts,
    completedWorkouts,
    weeklyStats,
    topUsers,
    assignmentStats,
  ] = await Promise.all([
    // Total users
    prisma.userInfo.count(),

    // Active users (users with workouts in last 30 days)
    prisma.userInfo.count({
      where: {
        userId: {
          in: (
            await prisma.workoutLog.findMany({
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                },
              },
              select: { userId: true },
              distinct: ["userId"],
            })
          ).map((log) => log.userId),
        },
      },
    }),

    // Total workout logs
    prisma.workoutLog.count(),

    // Completed workouts
    prisma.workoutLog.count({
      where: { inProgress: false },
    }),

    // Weekly workout stats
    prisma.workoutLog.groupBy({
      by: ["userId"],
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      _count: {
        id: true,
      },
    }),

    // Top users by workout count
    prisma.workoutLog.groupBy({
      by: ["userId"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 5,
    }),

    // Assignment completion stats
    prisma.assignedWorkout.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    }),
  ]);

  return {
    totalUsers,
    activeUsers,
    totalWorkouts,
    completedWorkouts,
    weeklyWorkoutCount: weeklyStats.reduce((sum, stat) => sum + stat._count.id, 0),
    topUsers,
    assignmentStats,
  };
}

async function getUserDetails(userIds: string[]) {
  return await prisma.userInfo.findMany({
    where: {
      userId: {
        in: userIds,
      },
    },
    select: {
      userId: true,
      role: true,
      createdAt: true,
    },
  });
}

export default async function Analytics() {
  const [analytics, chartData] = await Promise.all([
    getAnalyticsData(),
    getChartData(),
  ]);

  const topUserIds = analytics.topUsers.map(user => user.userId);
  const userDetails = await getUserDetails(topUserIds);

  const completionRate = analytics.totalWorkouts > 0
    ? (analytics.completedWorkouts / analytics.totalWorkouts) * 100
    : 0;

  const activityRate = analytics.totalUsers > 0
    ? (analytics.activeUsers / analytics.totalUsers) * 100
    : 0;

  const assignmentStats = analytics.assignmentStats.reduce((acc, stat) => {
    acc[stat.status] = stat._count.id;
    return acc;
  }, {} as Record<string, number>);

  const totalAssignments = Object.values(assignmentStats).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">User Analytics</h1>
        <p className="text-foreground-500 mt-2">
          Monitor user engagement, workout completion rates, and overall platform health.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-content1">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-500 mb-1">Total Users</p>
                <p className="text-2xl font-bold text-foreground">{analytics.totalUsers}</p>
                <p className="text-xs text-success">
                  {analytics.activeUsers} active this month
                </p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <IconUsers size={24} className="text-primary" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-content1">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-500 mb-1">Total Workouts</p>
                <p className="text-2xl font-bold text-foreground">{analytics.totalWorkouts}</p>
                <p className="text-xs text-success">
                  {analytics.weeklyWorkoutCount} this week
                </p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/10">
                <IconBarbell size={24} className="text-secondary" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-content1">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-500 mb-1">Completion Rate</p>
                <p className="text-2xl font-bold text-foreground">{completionRate.toFixed(1)}%</p>
                <p className="text-xs text-foreground-500">
                  {analytics.completedWorkouts} completed
                </p>
              </div>
              <div className="p-3 rounded-lg bg-success/10">
                <IconTarget size={24} className="text-success" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-content1">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-500 mb-1">Activity Rate</p>
                <p className="text-2xl font-bold text-foreground">{activityRate.toFixed(1)}%</p>
                <p className="text-xs text-foreground-500">
                  User engagement
                </p>
              </div>
              <div className="p-3 rounded-lg bg-warning/10">
                <IconTrendingUp size={24} className="text-warning" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-6">
        {/* Workout Frequency Chart */}
        <Card shadow="none" className="shadow-md h-72 col-span-2 lg:col-span-4 xl:col-span-2">
          <CardHeader className="p-3 gap-5 items-start justify-between">
            <p className="shrink-0 w-1/2 flex items-center gap-x-3 truncate text-xs uppercase">
              <span className="text-primary">
                <IconChartBar size={18} />
              </span>
              Workout Frequency
            </p>
          </CardHeader>
          <CardBody className="p-3 pb-0">
            <div className="w-full h-full flex items-end justify-center gap-2 pb-4">
              {chartData.workoutFrequency.map((count, index) => (
                <div key={index} className="flex flex-col items-center gap-1">
                  <div
                    className="bg-primary rounded-t w-8 min-h-4 flex items-end justify-center transition-all"
                    style={{
                      height: `${Math.max((count / Math.max(...chartData.workoutFrequency)) * 140, 16)}px`
                    }}
                  >
                    <span className="text-xs text-white font-medium mb-1">{count}</span>
                  </div>
                  <span className="text-xs text-foreground-500">
                    W{4-index}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* User Growth Chart */}
        <Card shadow="none" className="shadow-md h-72 col-span-2">
          <CardHeader className="p-3 gap-5 items-start justify-between">
            <p className="shrink-0 w-1/2 flex items-center gap-x-3 truncate text-xs uppercase">
              <span className="text-primary">
                <IconChartAreaFilled size={18} />
              </span>
              User Growth
            </p>
          </CardHeader>
          <CardBody className="p-3 pb-0">
            <div className="w-full h-full flex items-center justify-center text-center">
              <div>
                <div className="text-3xl font-bold text-primary mb-2">
                  {analytics.totalUsers}
                </div>
                <div className="text-sm text-foreground-500">Total Users</div>
                <div className="text-xs text-success mt-1">
                  +{chartData.userGrowth.reduce((sum, day) => sum + day._count.id, 0)} this month
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Activity Overview */}
        <Card shadow="none" className="shadow-md h-72 col-span-2">
          <CardHeader className="p-3 gap-5 items-start justify-between">
            <p className="shrink-0 w-1/2 flex items-center gap-x-3 truncate text-xs uppercase">
              <span className="text-primary">
                <IconChartLine size={18} />
              </span>
              Activity Overview
            </p>
          </CardHeader>
          <CardBody className="p-3 pb-0">
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary mb-1">
                  {analytics.weeklyWorkoutCount}
                </div>
                <div className="text-xs text-foreground-500">Workouts This Week</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Completion Rate</span>
                  <span className="font-medium">{completionRate.toFixed(1)}%</span>
                </div>
                <Progress value={completionRate} color="success" size="sm" />
                <div className="flex justify-between text-sm">
                  <span>Active Users</span>
                  <span className="font-medium">{activityRate.toFixed(1)}%</span>
                </div>
                <Progress value={activityRate} color="primary" size="sm" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assignment Progress */}
        <Card className="bg-content1">
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Assignment Progress</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Assignments</span>
                <span className="text-sm font-bold">{totalAssignments}</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Completed</span>
                    <span>{assignmentStats.COMPLETED || 0}</span>
                  </div>
                  <Progress
                    value={totalAssignments > 0 ? ((assignmentStats.COMPLETED || 0) / totalAssignments) * 100 : 0}
                    color="success"
                    size="sm"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>In Progress</span>
                    <span>{assignmentStats.IN_PROGRESS || 0}</span>
                  </div>
                  <Progress
                    value={totalAssignments > 0 ? ((assignmentStats.IN_PROGRESS || 0) / totalAssignments) * 100 : 0}
                    color="primary"
                    size="sm"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Pending</span>
                    <span>{assignmentStats.PENDING || 0}</span>
                  </div>
                  <Progress
                    value={totalAssignments > 0 ? ((assignmentStats.PENDING || 0) / totalAssignments) * 100 : 0}
                    color="warning"
                    size="sm"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Skipped</span>
                    <span>{assignmentStats.SKIPPED || 0}</span>
                  </div>
                  <Progress
                    value={totalAssignments > 0 ? ((assignmentStats.SKIPPED || 0) / totalAssignments) * 100 : 0}
                    color="danger"
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Top Users */}
        <Card className="bg-content1">
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Most Active Users</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {analytics.topUsers.map((user, index) => {
                const userDetail = userDetails.find(u => u.userId === user.userId);
                return (
                  <div key={user.userId} className="flex items-center justify-between p-3 bg-content2 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                        <span className="text-sm font-bold text-primary">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {user.userId.slice(0, 8)}...
                        </p>
                        {userDetail && (
                          <div className="flex items-center gap-2 mt-1">
                            <Chip
                              size="sm"
                              variant="flat"
                              color={userDetail.role === "ADMIN" ? "warning" : "primary"}
                            >
                              {userDetail.role}
                            </Chip>
                            <span className="text-xs text-foreground-500">
                              Since {new Date(userDetail.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{user._count.id}</p>
                      <p className="text-xs text-foreground-500">workouts</p>
                    </div>
                  </div>
                );
              })}
              {analytics.topUsers.length === 0 && (
                <div className="text-center py-8 text-foreground-500">
                  No workout data available yet
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <IconFlame size={24} className="text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Engagement</h3>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-foreground-500">
                {analytics.activeUsers} out of {analytics.totalUsers} users were active this month
              </p>
              <Progress value={activityRate} color="primary" size="sm" />
              <p className="text-xs text-foreground-500">
                {activityRate.toFixed(1)}% monthly activity rate
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <IconTarget size={24} className="text-success" />
              <h3 className="text-lg font-semibold text-foreground">Success Rate</h3>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-foreground-500">
                {analytics.completedWorkouts} workouts completed successfully
              </p>
              <Progress value={completionRate} color="success" size="sm" />
              <p className="text-xs text-foreground-500">
                {completionRate.toFixed(1)}% completion rate
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <IconCalendar size={24} className="text-warning" />
              <h3 className="text-lg font-semibold text-foreground">Weekly Trend</h3>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-foreground-500">
                {analytics.weeklyWorkoutCount} workouts completed this week
              </p>
              <div className="flex items-center gap-2">
                <IconTrendingUp size={16} className="text-warning" />
                <span className="text-sm font-medium text-warning">
                  {analytics.weeklyWorkoutCount > 0 ? "Active" : "Low Activity"}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}