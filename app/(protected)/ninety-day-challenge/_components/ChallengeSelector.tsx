"use client";

import { useRouter } from "next/navigation";
import { Button } from "@nextui-org/button";
import { Select, SelectItem } from "@nextui-org/select";
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
        variant="solid"
        startContent={<IconMessageCircle size={18} />}
        className="w-full sm:w-auto font-medium"
      >
        View All Posts
      </Button>

      {/* Challenge Selector */}
      {challenges.length > 1 && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-foreground-600">Switch Challenge:</span>
          <Select
            placeholder="Choose a challenge"
            selectedKeys={[selectedChallengeId]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              if (selected) {
                handleChallengeChange(selected);
              }
            }}
            className="w-full sm:w-48"
            size="sm"
            variant="bordered"
            aria-label="Switch Challenge"
          >
            {challenges.map((challenge) => (
              <SelectItem key={challenge.id} value={challenge.id}>
                {challenge.title}
              </SelectItem>
            ))}
          </Select>
        </div>
      )}
    </div>
  );
}