import { currentUser } from "@clerk/nextjs";
import DashboardCardTemplate from "./DashboardCardTemplate";
import { IconTarget } from "@tabler/icons-react";
import prisma from "@/prisma/prisma";
import Link from "next/link";

export default async function DashboardCardChallenges() {
  try {
    const user = await currentUser();
    if (!user) {
      return (
        <Link href="/ninety-day-challenge" className="block hover:scale-105 transition-transform duration-200">
          <DashboardCardTemplate
            title="Challenges"
            icon={<IconTarget className="text-primary" />}
          >
            0
          </DashboardCardTemplate>
        </Link>
      );
    }

    // Get active challenge participations for the user
    const activeParticipations = await prisma.ninetyDayChallengeParticipant.count({
      where: {
        userId: user.id,
        isEnabled: true,
        challenge: {
          isActive: true
        }
      }
    });

    return (
      <Link href="/ninety-day-challenge" className="block hover:scale-105 transition-transform duration-200">
        <DashboardCardTemplate
          title="Active Challenges"
          icon={<IconTarget className="text-primary" />}
        >
          {activeParticipations}
        </DashboardCardTemplate>
      </Link>
    );
  } catch (error) {
    console.error("Error fetching challenges data:", error);
    return (
      <Link href="/ninety-day-challenge" className="block hover:scale-105 transition-transform duration-200">
        <DashboardCardTemplate
          title="Challenges"
          icon={<IconTarget className="text-primary" />}
        >
          0
        </DashboardCardTemplate>
      </Link>
    );
  }
}