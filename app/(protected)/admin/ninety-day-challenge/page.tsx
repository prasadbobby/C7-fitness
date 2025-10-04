import { redirect } from "next/navigation";
import { checkAdminAuth } from "@/utils/adminAuth";
import { ChallengeManagement } from "./_components/ChallengeManagement";
import { ParticipantManagement } from "./_components/ParticipantManagement";
import { Card, CardHeader, CardBody } from "@nextui-org/card";
import { Chip } from "@nextui-org/chip";
import {
  IconCalendarEvent,
  IconUsers,
  IconTrendingUp,
  IconTarget,
  IconChartBar,
  IconFlame
} from "@tabler/icons-react";

export default async function NinetyDayChallengePage() {
  const { isAdmin } = await checkAdminAuth();

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      {/* Custom Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
            <IconFlame className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-foreground">
              90-Day Challenge Management
            </h1>
            <p className="text-zinc-500 text-sm md:text-base">
              Manage transformation challenges and monitor participant progress
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card shadow="none" className="shadow-md border-none">
          <CardHeader className="flex gap-3 pb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <IconCalendarEvent className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <p className="text-xs uppercase text-zinc-500 font-medium">Active Challenges</p>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            <p className="text-3xl font-bold text-primary">2</p>
          </CardBody>
        </Card>

        <Card shadow="none" className="shadow-md border-none">
          <CardHeader className="flex gap-3 pb-2">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <IconUsers className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex flex-col">
              <p className="text-xs uppercase text-zinc-500 font-medium">Total Participants</p>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            <p className="text-3xl font-bold text-secondary">48</p>
          </CardBody>
        </Card>

        <Card shadow="none" className="shadow-md border-none">
          <CardHeader className="flex gap-3 pb-2">
            <div className="p-2 bg-success/10 rounded-lg">
              <IconTrendingUp className="w-5 h-5 text-success" />
            </div>
            <div className="flex flex-col">
              <p className="text-xs uppercase text-zinc-500 font-medium">Completion Rate</p>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            <p className="text-3xl font-bold text-success">74%</p>
          </CardBody>
        </Card>

        <Card shadow="none" className="shadow-md border-none">
          <CardHeader className="flex gap-3 pb-2">
            <div className="p-2 bg-warning/10 rounded-lg">
              <IconTarget className="w-5 h-5 text-warning" />
            </div>
            <div className="flex flex-col">
              <p className="text-xs uppercase text-zinc-500 font-medium">Avg Progress</p>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            <p className="text-3xl font-bold text-warning">67</p>
            <p className="text-xs text-zinc-500">days completed</p>
          </CardBody>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Challenge Management - Takes 2/3 width on xl screens */}
        <div className="xl:col-span-2">
          <Card shadow="none" className="shadow-md border-none h-full">
            <CardHeader className="flex items-center gap-4 pb-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <IconCalendarEvent className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">
                  Challenge Management
                </h2>
                <p className="text-sm text-zinc-500">
                  Create and manage 90-day transformation challenges
                </p>
              </div>
              <Chip
                color="primary"
                variant="flat"
                size="sm"
                startContent={<IconChartBar className="w-3 h-3" />}
              >
                Management Hub
              </Chip>
            </CardHeader>
            <CardBody className="pt-0">
              <ChallengeManagement />
            </CardBody>
          </Card>
        </div>

        {/* Participant Management - Takes 1/3 width on xl screens */}
        <div className="xl:col-span-1">
          <Card shadow="none" className="shadow-md border-none h-full">
            <CardHeader className="flex items-center gap-4 pb-4">
              <div className="p-3 bg-secondary/10 rounded-xl">
                <IconUsers className="w-6 h-6 text-secondary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">
                  Participants
                </h2>
                <p className="text-sm text-zinc-500">
                  Manage challenge participants
                </p>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <ParticipantManagement />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}