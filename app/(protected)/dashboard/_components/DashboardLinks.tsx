import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { Card, CardHeader } from "@nextui-org/card";
import { currentUser } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";

export default async function DashboardLinks() {
  // Check if user has challenges enabled
  const user = await currentUser();
  let isChallengesEnabled = false;

  if (user) {
    try {
      const challengeParticipant = await prisma.ninetyDayChallengeParticipant.findFirst({
        where: {
          userId: user.id,
          isEnabled: true,
        },
      });
      isChallengesEnabled = !!challengeParticipant;
    } catch (error) {
      console.error("Error checking challenge access:", error);
      isChallengesEnabled = false;
    }
  }

  const baseLinks = [
    {
      title: "Exercises",
      description: "Browse Exercises",
      image: "02.webp",
      href: "/exercises",
      titleColour: "text-white",
      descriptionColour: "text-primary",
    },
    {
      title: "Workout",
      description: "Start a Workout",
      image: "e.webp",
      href: "/workout",
      titleColour: "text-white",
      descriptionColour: "text-primary",
    },
    {
      title: "Activity",
      description: "View Activity",
      image: "22.webp",
      href: "/activity",
      titleColour: "text-white",
      descriptionColour: "text-primary",
    },
  ];

  // Only add Challenges link if user has challenges enabled
  const links = isChallengesEnabled
    ? [
        ...baseLinks,
        {
          title: "Challenges",
          description: "Join Challenges",
          image: "21.webp",
          href: "/ninety-day-challenge",
          titleColour: "text-white",
          descriptionColour: "text-primary",
        },
      ]
    : baseLinks;

  // Dynamic grid layout based on number of links
  const gridCols = links.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3";

  return (
    <div className={`grid grid-cols-2 ${gridCols} gap-3 mb-3`}>
      {links.map((link, index) => (
        <Link key={index} href={link.href}>
          <Card
            key={index}
            className="w-full aspect-square xl:aspect-video shadow-md"
            isPressable
            shadow="none"
          >
            <CardHeader className="absolute z-10 top-1 flex-col !items-start">
              <p
                className={clsx(
                  "text-xs uppercase font-bold",
                  link.titleColour,
                )}
              >
                {link.title}
              </p>
              <p
                className={clsx("font-medium text-xl", link.descriptionColour)}
              >
                {link.description}
              </p>
            </CardHeader>
            <Image
              alt="Card background"
              className="z-0 w-full h-full object-cover dark:brightness-50 grayscale"
              src={`/card-images/${link.image}`}
              width={640}
              height={640}
            />
          </Card>
        </Link>
      ))}
    </div>
  );
}
