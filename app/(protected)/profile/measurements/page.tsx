import { currentUser } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";
import Link from "next/link";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
} from "@nextui-org/react";
import {
  IconRulerMeasure,
  IconArrowLeft,
  IconChartLine,
} from "@tabler/icons-react";

import EnhancedProfileMeasurements from "../_components/EnhancedProfileMeasurements";

export const dynamic = 'force-dynamic';

export default async function MeasurementsPage() {
  const user = await currentUser();

  if (!user) {
    throw new Error("You must be signed in to view this page.");
  }

  const userId = user.id;

  const userMeasurements = await prisma.userInfo.findUnique({
    where: {
      userId: userId,
    },
    select: {
      age: true,
      height: true,
      weight: true,
      role: true,
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-Friendly Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-divider">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              as={Link}
              href="/profile"
              variant="light"
              size="sm"
              isIconOnly
              startContent={<IconArrowLeft size={18} />}
            />
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Measurements
              </h1>
              <p className="text-xs text-foreground-500">
                Track your progress
              </p>
            </div>
          </div>
          <div className="p-2 bg-primary/10 rounded-full">
            <IconRulerMeasure size={20} className="text-primary" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-4 p-4">

        {/* Measurements Section */}
        <EnhancedProfileMeasurements userMeasurements={userMeasurements} />

        {/* Mobile-Friendly Tips Section */}
        {/* <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <IconChartLine size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Measurement Tips</h3>
                <p className="text-xs text-foreground-500">Best practices for tracking</p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="space-y-3">
              <div className="p-3 bg-content2 rounded-lg">
                <h4 className="font-semibold text-sm mb-1">🕐 Consistency is Key</h4>
                <p className="text-xs text-foreground-500">
                  Take measurements at the same time daily, preferably in the morning.
                </p>
              </div>
              <div className="p-3 bg-content2 rounded-lg">
                <h4 className="font-semibold text-sm mb-1">📏 Proper Technique</h4>
                <p className="text-xs text-foreground-500">
                  Use a flexible tape, snug but not tight. Don't compress the skin.
                </p>
              </div>
              <div className="p-3 bg-content2 rounded-lg">
                <h4 className="font-semibold text-sm mb-1">📈 Track Trends</h4>
                <p className="text-xs text-foreground-500">
                  Focus on long-term trends rather than daily fluctuations.
                </p>
              </div>
              <div className="p-3 bg-content2 rounded-lg">
                <h4 className="font-semibold text-sm mb-1">📊 Multiple Metrics</h4>
                <p className="text-xs text-foreground-500">
                  Don't rely on weight alone. Body composition gives the complete picture.
                </p>
              </div>
            </div>
          </CardBody>
        </Card> */}
      </div>
    </div>
  );
}