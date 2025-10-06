import { Card, CardBody, CardHeader } from "@nextui-org/react";
import {
  IconUsers,
  IconBarbell,
  IconTrendingUp,
  IconCalendarEvent,
  IconClipboardList,
  IconJumpRope,
  IconActivity,
} from "@tabler/icons-react";
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import prisma from "@/prisma/prisma";
import { clerkClient } from "@clerk/nextjs";

export const dynamic = 'force-dynamic';

async function getAdminStats() {
  const [totalUsers, totalWorkouts, totalAssignments, recentActivity] = await Promise.all([
    prisma.userInfo.count(),
    prisma.workoutPlan.count(),
    prisma.assignedWorkout.count(),
    prisma.workoutLog.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    }),
  ]);

  return {
    totalUsers,
    totalWorkouts,
    totalAssignments,
    recentActivity,
  };
}

async function getRecentUsers() {
  const users = await prisma.userInfo.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      userId: true,
      role: true,
      createdAt: true,
    },
  });

  // Fetch Clerk user data for usernames
  const usersWithClerkData = await Promise.all(
    users.map(async (user) => {
      try {
        const clerkUser = await clerkClient.users.getUser(user.userId);
        return {
          ...user,
          username: clerkUser.username || clerkUser.firstName || clerkUser.emailAddresses[0]?.emailAddress || user.userId,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          imageUrl: clerkUser.imageUrl,
        };
      } catch (error) {
        return {
          ...user,
          username: user.userId,
          email: null,
          firstName: null,
          lastName: null,
          imageUrl: null,
        };
      }
    })
  );

  return usersWithClerkData;
}

export default async function AdminDashboard() {
  const stats = await getAdminStats();
  const recentUsers = await getRecentUsers();

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: IconUsers,
      color: "primary" as const,
    },
    {
      title: "Total Workouts",
      value: stats.totalWorkouts,
      icon: IconBarbell,
      color: "secondary" as const,
    },
    {
      title: "Active Assignments",
      value: stats.totalAssignments,
      icon: IconCalendarEvent,
      color: "success" as const,
    },
    {
      title: "Recent Activity (7d)",
      value: stats.recentActivity,
      icon: IconTrendingUp,
      color: "warning" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-foreground-500 mt-2">
          Admin dashboard - manage workouts, routines, and track activity.
        </p>
      </div>

      {/* Main Action Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        {/* Browse Exercises Card */}
        <Link href="/exercises">
          <Card
            className="w-full aspect-square xl:aspect-video shadow-md"
            isPressable
            shadow="none"
          >
            <CardHeader className="absolute z-10 top-1 flex-col !items-start">
              <p className="text-xs uppercase font-bold text-white">
                Exercises
              </p>
              <p className="font-medium text-xl text-primary">
                Browse Exercises
              </p>
            </CardHeader>
            <Image
              alt="Card background"
              className="z-0 w-full h-full object-cover dark:brightness-50 grayscale"
              src="/card-images/02.webp"
              width={640}
              height={640}
            />
          </Card>
        </Link>

        {/* Routine Card */}
        <Link href="/edit-routine/step-1">
          <Card
            className="w-full aspect-square xl:aspect-video shadow-md"
            isPressable
            shadow="none"
          >
            <CardHeader className="absolute z-10 top-1 flex-col !items-start">
              <p className="text-xs uppercase font-bold text-white">
                Routine
              </p>
              <p className="font-medium text-xl text-primary">
                Create a Routine
              </p>
            </CardHeader>
            <Image
              alt="Card background"
              className="z-0 w-full h-full object-cover dark:brightness-50 grayscale"
              src="/card-images/21.webp"
              width={640}
              height={640}
            />
          </Card>
        </Link>

        {/* Workout Card */}
        <Link href="/workout">
          <Card
            className="w-full aspect-square xl:aspect-video shadow-md"
            isPressable
            shadow="none"
          >
            <CardHeader className="absolute z-10 top-1 flex-col !items-start">
              <p className="text-xs uppercase font-bold text-white">
                Workout
              </p>
              <p className="font-medium text-xl text-primary">
                Start a Workout
              </p>
            </CardHeader>
            <Image
              alt="Card background"
              className="z-0 w-full h-full object-cover dark:brightness-50 grayscale"
              src="/card-images/e.webp"
              width={640}
              height={640}
            />
          </Card>
        </Link>

        {/* Activity Card */}
        <Link href="/admin/analytics">
          <Card
            className="w-full aspect-square xl:aspect-video shadow-md"
            isPressable
            shadow="none"
          >
            <CardHeader className="absolute z-10 top-1 flex-col !items-start">
              <p className="text-xs uppercase font-bold text-white">
                Activity
              </p>
              <p className="font-medium text-xl text-primary">
                View Activity
              </p>
            </CardHeader>
            <Image
              alt="Card background"
              className="z-0 w-full h-full object-cover dark:brightness-50 grayscale"
              src="/card-images/22.webp"
              width={640}
              height={640}
            />
          </Card>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="bg-content1">
              <CardBody className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground-500 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-${stat.color}/10`}>
                    <Icon size={24} className={`text-${stat.color}`} />
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card className="bg-content1">
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Recent Users</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.userId} className="flex items-center gap-3 p-3 bg-content2 rounded-lg">
                  {user.imageUrl && (
                    <img
                      src={user.imageUrl}
                      alt="User avatar"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">
                        {user.username}
                      </p>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === "ADMIN" || user.role === "SUPER_ADMIN"
                          ? "bg-warning/10 text-warning"
                          : "bg-primary/10 text-primary"
                      }`}>
                        {user.role}
                      </div>
                    </div>
                    {user.email && (
                      <p className="text-xs text-foreground-500">{user.email}</p>
                    )}
                    <p className="text-xs text-foreground-400">
                      Joined {new Date(user.createdAt).toLocaleDateString()} • ID: {user.userId.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-content1">
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <Link href="/admin/users">
                <div className="p-4 bg-content2 rounded-lg border-l-4 border-primary hover:bg-content3 transition-colors cursor-pointer">
                  <h4 className="font-medium text-foreground">User Management</h4>
                  <p className="text-sm text-foreground-500 mt-1">
                    View, edit, and manage user accounts and permissions.
                  </p>
                </div>
              </Link>
              <Link href="/admin/workouts">
                <div className="p-4 bg-content2 rounded-lg border-l-4 border-secondary hover:bg-content3 transition-colors cursor-pointer">
                  <h4 className="font-medium text-foreground">Workout Assignment</h4>
                  <p className="text-sm text-foreground-500 mt-1">
                    Assign personalized workouts to users based on their fitness goals.
                  </p>
                </div>
              </Link>
              <Link href="/admin/analytics">
                <div className="p-4 bg-content2 rounded-lg border-l-4 border-success hover:bg-content3 transition-colors cursor-pointer">
                  <h4 className="font-medium text-foreground">Analytics</h4>
                  <p className="text-sm text-foreground-500 mt-1">
                    View detailed analytics and user progress reports.
                  </p>
                </div>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}