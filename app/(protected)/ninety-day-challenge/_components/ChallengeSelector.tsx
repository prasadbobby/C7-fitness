"use client";

import { useRouter } from "next/navigation";
import { Button } from "@nextui-org/button";
import { IconMessageCircle } from "@tabler/icons-react";
import Link from "next/link";

interface Challenge {
  id: string;
  title: string;
}

interface ChallengeSelectorProps {
  challenges: Challenge[];
  selectedChallengeId: string;
}

export function ChallengeSelector({ challenges, selectedChallengeId }: ChallengeSelectorProps) {
  const router = useRouter();

  const handleChallengeChange = (challengeId: string) => {
    router.push(`/ninety-day-challenge?challengeId=${challengeId}`);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
      {/* View All Posts Button */}
      <Button
        as={Link}
        href={`/ninety-day-challenge/posts?challengeId=${selectedChallengeId}`}
        color="primary"
        variant="shadow"
        startContent={<IconMessageCircle size={18} />}
        className="w-full sm:w-auto font-medium"
      >
        View All Posts
      </Button>

      {/* Challenge Selector */}
      {challenges.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">Switch Challenge:</span>
          <select
            className="px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-background text-foreground text-sm"
            value={selectedChallengeId}
            onChange={(e) => handleChallengeChange(e.target.value)}
          >
            {challenges.map((challenge) => (
              <option key={challenge.id} value={challenge.id}>
                {challenge.title}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}