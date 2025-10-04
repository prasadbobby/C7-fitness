"use client";

import { useState, useEffect } from "react";
import { Button } from "@nextui-org/button";
import { Card, CardBody } from "@nextui-org/card";
import { useDisclosure } from "@nextui-org/use-disclosure";
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from "@nextui-org/popover";

// Reaction types similar to DEV Community
export type ReactionType = "LIKE" | "LOVE" | "UNICORN" | "FIRE" | "BOOKMARK" | "HANDS";

export interface ReactionData {
  type: ReactionType;
  emoji: string;
  label: string;
  color: string;
}

export const REACTIONS: ReactionData[] = [
  { type: "LIKE", emoji: "👍", label: "Like", color: "text-blue-500" },
  { type: "LOVE", emoji: "❤️", label: "Love", color: "text-red-500" },
  { type: "UNICORN", emoji: "🦄", label: "Unicorn", color: "text-purple-500" },
  { type: "FIRE", emoji: "🔥", label: "Fire", color: "text-orange-500" },
  { type: "BOOKMARK", emoji: "🔖", label: "Bookmark", color: "text-yellow-500" },
  { type: "HANDS", emoji: "🙌", label: "Hands", color: "text-green-500" },
];

interface PostReactionsProps {
  postId: string;
  reactions: { [key in ReactionType]?: number };
  userReaction?: ReactionType | null;
  onReactionToggle: (postId: string, reactionType: ReactionType) => void;
  size?: "sm" | "md" | "lg";
  showCounts?: boolean;
}

export default function PostReactions({
  postId,
  reactions,
  userReaction,
  onReactionToggle,
  size = "md",
  showCounts = true
}: PostReactionsProps) {
  const [isAnimating, setIsAnimating] = useState<ReactionType | null>(null);
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();

  const handleReactionClick = (reactionType: ReactionType) => {
    setIsAnimating(reactionType);
    onReactionToggle(postId, reactionType);
    onClose();

    // Reset animation after completion
    setTimeout(() => setIsAnimating(null), 600);
  };

  const getEmojiSize = () => {
    switch (size) {
      case "sm": return "text-sm";
      case "md": return "text-base";
      case "lg": return "text-lg";
      default: return "text-base";
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case "sm": return "sm";
      case "md": return "md";
      case "lg": return "lg";
      default: return "md";
    }
  };

  // Calculate total reactions
  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + (count || 0), 0);

  // Get user's current reaction data
  const currentReactionData = userReaction ? REACTIONS.find(r => r.type === userReaction) : null;

  return (
    <div className="flex items-center gap-2">
      {/* Main reaction button */}
      <Popover
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="top"
        showArrow
      >
        <PopoverTrigger>
          <Button
            variant={currentReactionData ? "flat" : "light"}
            color={currentReactionData ? "primary" : "default"}
            size={getButtonSize()}
            startContent={
              <span className={`${getEmojiSize()} ${isAnimating === userReaction ? 'animate-bounce' : ''}`}>
                {currentReactionData ? currentReactionData.emoji : "👍"}
              </span>
            }
            className={`transition-all duration-200 hover:scale-105 ${
              currentReactionData ? currentReactionData.color : ''
            }`}
          >
            {showCounts && totalReactions > 0 && (
              <span className="text-sm font-medium">
                {totalReactions}
              </span>
            )}
            {!showCounts && "React"}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="p-1">
          <Card shadow="sm" className="border-none">
            <CardBody className="p-2">
              <div className="grid grid-cols-3 gap-1">
                {REACTIONS.map((reaction) => (
                  <Button
                    key={reaction.type}
                    variant="light"
                    size="sm"
                    isIconOnly
                    className={`
                      relative transition-all duration-200 hover:scale-110 hover:bg-default-100
                      ${userReaction === reaction.type ? 'bg-primary/10 ring-2 ring-primary/30' : ''}
                      ${isAnimating === reaction.type ? 'animate-pulse' : ''}
                    `}
                    onPress={() => handleReactionClick(reaction.type)}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-lg">{reaction.emoji}</span>
                      {reactions[reaction.type] && reactions[reaction.type]! > 0 && (
                        <span className="text-xs text-foreground-500 font-medium">
                          {reactions[reaction.type]}
                        </span>
                      )}
                    </div>

                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2
                                    bg-foreground text-background text-xs px-2 py-1 rounded
                                    opacity-0 group-hover:opacity-100 transition-opacity
                                    pointer-events-none whitespace-nowrap z-10">
                      {reaction.label}
                    </div>
                  </Button>
                ))}
              </div>
            </CardBody>
          </Card>
        </PopoverContent>
      </Popover>

      {/* Show breakdown of reactions if there are any */}
      {showCounts && totalReactions > 0 && (
        <div className="flex items-center gap-1 text-xs text-foreground-500">
          {Object.entries(reactions)
            .filter(([_, count]) => count && count > 0)
            .slice(0, 3) // Show only top 3 reaction types
            .map(([type, count]) => {
              const reactionData = REACTIONS.find(r => r.type === type);
              return reactionData ? (
                <div key={type} className="flex items-center gap-0.5">
                  <span>{reactionData.emoji}</span>
                  <span>{count}</span>
                </div>
              ) : null;
            })}
        </div>
      )}
    </div>
  );
}