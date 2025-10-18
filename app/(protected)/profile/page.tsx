import { currentUser } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";
import Link from "next/link";
import {
  Card,
  CardBody,
  CardHeader,
  Avatar,
  Button,
} from "@nextui-org/react";
import {
  IconCalendar,
  IconBarbell,
  IconTrendingUp,
  IconSettings,
  IconTarget,
  IconClock,
  IconRulerMeasure,
  IconChevronRight,
} from "@tabler/icons-react";
import { formatDuration } from "@/utils/time";

import ProfileDetails from "./_components/ProfileDetails";
import ProfileActions from "./_components/ProfileActions";
import ProfileMembership from "./_components/ProfileMembership";
import PaymentInfo from "./_components/PaymentInfo";

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await currentUser();

  if (!user) {
    throw new Error("You must be signed in to view this page.");
  }

  const userId = user.id;
  const username = user?.username || undefined;
  const firstName = user?.firstName || undefined;
  const lastName = user?.lastName || undefined;
  const userImage = user?.imageUrl || undefined;
  const email = user?.emailAddresses?.[0]?.emailAddress || undefined;

  const userMeasurements = await prisma.userInfo.findUnique({
    where: {
      userId: userId,
    },
    select: {
      age: true,
      height: true,
      weight: true,
      dateOfBirth: true,
      role: true,
    },
  });

  // Get current training progression
  const currentTrainingProgression = await prisma.userTrainingProgression.findFirst({
    where: {
      userId: userId,
      isActive: true,
    },
    select: {
      trainingType: true,
      startDate: true,
      targetWeeks: true,
      notes: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });


  // Get user stats from workout logs and assignments
  const workoutStats = await prisma.workoutLog.aggregate({
    where: {
      userId: userId,
    },
    _count: {
      id: true,
    },
    _avg: {
      duration: true,
    },
  });

  const assignmentStats = await prisma.assignedWorkout.aggregate({
    where: {
      userId: userId,
    },
    _count: {
      id: true,
    },
  });

  const completedAssignments = await prisma.assignedWorkout.count({
    where: {
      userId: userId,
      status: 'COMPLETED',
    },
  });

  const totalWorkouts = workoutStats._count.id || 0;
  const avgDuration = Math.round(workoutStats._avg.duration || 0);
  const totalAssignments = assignmentStats._count.id || 0;
  const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

  // Calculate age from date of birth
  const calculateAge = () => {
    if (userMeasurements?.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(userMeasurements.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    }
    return userMeasurements?.age || null; // Fallback to stored age if no DOB
  };

  // Get latest measurements for height, weight, etc.
  const latestHeightMeasurement = await prisma.bodyMeasurement.findFirst({
    where: {
      userId: userId,
      measurementType: 'HEIGHT',
    },
    orderBy: {
      recordedDate: 'desc',
    },
  });

  const latestWeightMeasurement = await prisma.bodyMeasurement.findFirst({
    where: {
      userId: userId,
      measurementType: 'WEIGHT',
    },
    orderBy: {
      recordedDate: 'desc',
    },
  });

  // Calculate BMI from latest measurements
  const calculateBMI = () => {
    const height = latestHeightMeasurement?.value || userMeasurements?.height;
    const weight = latestWeightMeasurement?.value || userMeasurements?.weight;

    if (height && weight) {
      // Convert height to meters (assuming measurements are in cm, userInfo might be in cm too)
      const heightInM = height / 100;
      return (weight / (heightInM * heightInM)).toFixed(1);
    }
    return null;
  };

  const age = calculateAge();
  const currentHeight = latestHeightMeasurement?.value || userMeasurements?.height;
  const currentWeight = latestWeightMeasurement?.value || userMeasurements?.weight;
  const bmi = calculateBMI();

  // Get measurement summary
  const measurementCount = await prisma.bodyMeasurement.count({
    where: {
      userId: userId,
    },
  });

  const latestMeasurements = await prisma.bodyMeasurement.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      recordedDate: 'desc',
    },
    take: 3,
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 border border-divider">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative">
              <Avatar
                src={userImage}
                name={username || firstName || "User"}
                size="lg"
                className="w-24 h-24 border-4 border-white shadow-lg"
                showFallback
              />
            
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-4xl font-bold text-foreground mb-2">
                {firstName || username || "User"}
              </h1>
              <p className="text-foreground-500 text-lg mb-3">
                {username && firstName ? `@${username}` : email}
              </p>
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                {currentTrainingProgression?.trainingType && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                    <IconTarget size={14} className="text-primary" />
                    <span className="text-sm font-medium text-primary">
                      {currentTrainingProgression.trainingType.replace('_', ' ')}
                    </span>
                  </div>
                )}
                {age && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-content2 rounded-full">
                    <IconCalendar size={14} className="text-primary" />
                    <span className="text-sm">{age} years</span>
                  </div>
                )}
                {currentHeight && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-content2 rounded-full">
                    <span className="text-sm">📏 {currentHeight} cm</span>
                  </div>
                )}
                {currentWeight && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-content2 rounded-full">
                    <span className="text-sm">⚖️ {currentWeight} {latestWeightMeasurement?.unit || 'kg'}</span>
                  </div>
                )}
                {bmi && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-content2 rounded-full">
                    <span className="text-sm">BMI: {bmi}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              as={Link}
              href="/profile/advanced"
              color="primary"
              variant="solid"
              startContent={<IconSettings size={18} />}
              className="font-semibold"
            >
              Advanced Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-success/10 to-success/20 border-success/20">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-success-600 font-semibold uppercase tracking-wide">Completion Rate</p>
                <p className="text-2xl font-bold text-success">{completionRate}%</p>
              </div>
              <div className="p-3 bg-success/20 rounded-full">
                <IconTrendingUp size={20} className="text-success" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/20 border-primary/20">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-primary-600 font-semibold uppercase tracking-wide">Total Workouts</p>
                <p className="text-2xl font-bold text-primary">{totalWorkouts}</p>
              </div>
              <div className="p-3 bg-primary/20 rounded-full">
                <IconBarbell size={20} className="text-primary" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-warning/10 to-warning/20 border-warning/20">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-warning-600 font-semibold uppercase tracking-wide">Avg Duration</p>
                <p className="text-2xl font-bold text-warning">{formatDuration(avgDuration)}</p>
              </div>
              <div className="p-3 bg-warning/20 rounded-full">
                <IconClock size={20} className="text-warning" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/20 border-secondary/20">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-secondary-600 font-semibold uppercase tracking-wide">Assignments</p>
                <p className="text-2xl font-bold text-secondary">{totalAssignments}</p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-full">
                <IconTarget size={20} className="text-secondary" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>



      {/* Membership Section */}
      <ProfileMembership />

      {/* Payment Information */}
      <PaymentInfo />

      {/* Profile Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <ProfileDetails
            username={username}
            firstName={firstName}
            lastName={lastName}
            dateOfBirth={userMeasurements?.dateOfBirth}
          />
          {/* Body Measurements Summary */}
          <Card shadow="none" className="shadow-md">
            <CardHeader className="text-xl font-semibold px-5 pb-4 gap-x-3 items-center justify-between">
              <div className="flex items-center gap-3">
                <IconRulerMeasure className="text-primary" />
                <div>
                  <h3 className="text-lg font-semibold">Body Measurements</h3>
                  <p className="text-sm text-foreground-500">Track your fitness progress</p>
                </div>
              </div>
              <Button
                as={Link}
                href="/profile/measurements"
                color="primary"
                variant="flat"
                endContent={<IconChevronRight size={16} />}
                size="sm"
              >
                View All
              </Button>
            </CardHeader>
            <CardBody className="px-5">
              {measurementCount > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <p className="text-sm font-medium text-primary">Total Measurements</p>
                      <p className="text-2xl font-bold text-primary">{measurementCount}</p>
                    </div>
                    <div className="p-3 bg-success/10 rounded-lg">
                      <p className="text-sm font-medium text-success">Latest Updates</p>
                      <p className="text-2xl font-bold text-success">{latestMeasurements.length}</p>
                      <p className="text-xs text-success-600">Recent entries</p>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center py-6">
                  <IconRulerMeasure size={48} className="text-foreground-300 mx-auto mb-3" />
                  <p className="text-foreground-500 mb-4">No measurements recorded yet</p>
                  <Button
                    as={Link}
                    href="/profile/measurements"
                    color="primary"
                    variant="flat"
                    startContent={<IconRulerMeasure size={16} />}
                  >
                    Start Tracking
                  </Button>
                </div>
              )}

              <div className="pt-4 mt-4 border-t border-divider">
                <p className="text-xs text-foreground-400 text-center">
                  Visit the measurements page to track all body metrics and view detailed progress charts.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-danger/10 rounded-lg">
                  <IconSettings size={24} className="text-danger" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Account Actions</h3>
                  <p className="text-sm text-foreground-500">Manage your account</p>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <ProfileActions />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
