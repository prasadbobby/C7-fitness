"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { Chip } from "@nextui-org/chip";
import { User } from "@nextui-org/user";
import { Divider } from "@nextui-org/divider";
import { Pagination } from "@nextui-org/pagination";
import {
  IconHeart,
  IconFlame,
  IconTrendingUp,
  IconHandRock,
  IconHandStop,
  IconSparkles
} from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";

interface PostReaction {
  id: string;
  userId: string;
  reactionType: string;
  createdAt: string;
}

interface Post {
  id: string;
  date: string;
  sleepHours: number;
  sleepQuality: string;
  mealTracking: string;
  dayDescription: string;
  mood: string;
  energy: string;
  achievements: string;
  challenges: string;
  photos: string[];
  createdAt: string;
  updatedAt: string;
  user: {
    firstName: string;
    lastName: string;
    imageUrl: string;
  };
  reactions: PostReaction[];
  _count: {
    reactions: number;
  };
}

export function PostsFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userReactions, setUserReactions] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPosts();
  }, [currentPage]);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`/api/ninety-day-challenge/posts?page=${currentPage}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
        setTotalPages(data.totalPages);

        // Create a map of user reactions
        const reactions: Record<string, string> = {};
        data.posts.forEach((post: Post) => {
          const userReaction = post.reactions.find(r => r.userId === data.currentUserId);
          if (userReaction) {
            reactions[post.id] = userReaction.reactionType;
          }
        });
        setUserReactions(reactions);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (postId: string, reactionType: string) => {
    try {
      const currentReaction = userReactions[postId];

      if (currentReaction === reactionType) {
        // Remove reaction
        const response = await fetch(`/api/ninety-day-challenge/posts/${postId}/reactions`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reactionType }),
        });

        if (response.ok) {
          setUserReactions(prev => {
            const updated = { ...prev };
            delete updated[postId];
            return updated;
          });

          // Update post reactions count
          setPosts(prev => prev.map(post =>
            post.id === postId
              ? { ...post, _count: { reactions: post._count.reactions - 1 } }
              : post
          ));
        }
      } else {
        // Add or change reaction
        const response = await fetch(`/api/ninety-day-challenge/posts/${postId}/reactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reactionType }),
        });

        if (response.ok) {
          setUserReactions(prev => ({
            ...prev,
            [postId]: reactionType
          }));

          // Update post reactions count
          setPosts(prev => prev.map(post =>
            post.id === postId
              ? {
                  ...post,
                  _count: {
                    reactions: currentReaction
                      ? post._count.reactions
                      : post._count.reactions + 1
                  }
                }
              : post
          ));
        }
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const getReactionIcon = (type: string, isActive: boolean) => {
    const iconProps = { size: 18, className: isActive ? 'text-primary' : 'text-zinc-400' };

    switch (type) {
      case 'LIKE':
        return <IconHeart {...iconProps} fill={isActive ? "currentColor" : "none"} />;
      case 'LOVE':
        return <IconSparkles {...iconProps} />;
      case 'SUPPORT':
        return <IconHandStop {...iconProps} />;
      case 'STRONG':
        return <IconHandRock {...iconProps} />;
      case 'FIRE':
        return <IconFlame {...iconProps} />;
      case 'CLAP':
        return <IconTrendingUp {...iconProps} />;
      default:
        return <IconHeart {...iconProps} />;
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'EXCELLENT':
        return 'success';
      case 'VERY_GOOD':
        return 'primary';
      case 'GOOD':
        return 'secondary';
      case 'NEUTRAL':
        return 'default';
      case 'LOW':
      case 'VERY_LOW':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getEnergyColor = (energy: string) => {
    switch (energy) {
      case 'VERY_HIGH':
      case 'HIGH':
        return 'success';
      case 'MODERATE':
        return 'primary';
      case 'LOW':
        return 'warning';
      case 'VERY_LOW':
        return 'danger';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardBody>
              <div className="animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3"></div>
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/4 mt-1"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4"></div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <User
                name={`${post.user.firstName} ${post.user.lastName}`}
                description={`${formatDistanceToNow(new Date(post.date))} ago`}
                avatarProps={{
                  src: post.user.imageUrl,
                }}
                classNames={{ description: "text-zinc-500" }}
              />
              <div className="text-sm text-zinc-500">
                Day {Math.ceil((new Date(post.date).getTime() - new Date().getTime() + 90 * 24 * 60 * 60 * 1000) / (24 * 60 * 60 * 1000))}
              </div>
            </div>
          </CardHeader>

          <CardBody className="space-y-4">
            {/* Stats Row */}
            <div className="flex flex-wrap gap-2">
              <Chip size="sm" variant="flat">
                😴 {post.sleepHours}h
              </Chip>
              {post.mood && (
                <Chip size="sm" color={getMoodColor(post.mood)} variant="flat">
                  😊 {post.mood.toLowerCase().replace('_', ' ')}
                </Chip>
              )}
              {post.energy && (
                <Chip size="sm" color={getEnergyColor(post.energy)} variant="flat">
                  ⚡ {post.energy.toLowerCase().replace('_', ' ')}
                </Chip>
              )}
              {post.sleepQuality && (
                <Chip size="sm" variant="flat">
                  🛏️ {post.sleepQuality.toLowerCase().replace('_', ' ')}
                </Chip>
              )}
            </div>

            {/* Day Description */}
            {post.dayDescription && (
              <div>
                <p className="text-zinc-700 dark:text-zinc-300">{post.dayDescription}</p>
              </div>
            )}

            {/* Achievements */}
            {post.achievements && (
              <div>
                <h4 className="font-medium text-green-600 dark:text-green-400 mb-1">
                  🏆 Achievements
                </h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{post.achievements}</p>
              </div>
            )}

            {/* Challenges */}
            {post.challenges && (
              <div>
                <h4 className="font-medium text-orange-600 dark:text-orange-400 mb-1">
                  💪 Challenges
                </h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{post.challenges}</p>
              </div>
            )}

            {/* Meals */}
            {post.mealTracking && (
              <div>
                <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-1">
                  🍽️ Meals
                </h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{post.mealTracking}</p>
              </div>
            )}

            {/* Photos */}
            {post.photos && post.photos.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {post.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Progress photo ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}

            <Divider />

            {/* Reactions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {['LIKE', 'LOVE', 'SUPPORT', 'STRONG', 'FIRE', 'CLAP'].map((reactionType) => (
                  <Button
                    key={reactionType}
                    size="sm"
                    variant="light"
                    className="min-w-0 p-2"
                    onPress={() => handleReaction(post.id, reactionType)}
                  >
                    {getReactionIcon(reactionType, userReactions[post.id] === reactionType)}
                  </Button>
                ))}
              </div>

              <div className="text-sm text-zinc-500">
                {post._count.reactions} {post._count.reactions === 1 ? 'reaction' : 'reactions'}
              </div>
            </div>
          </CardBody>
        </Card>
      ))}

      {posts.length === 0 && (
        <Card>
          <CardBody className="text-center py-8">
            <p className="text-zinc-500">No posts yet. Be the first to share your progress!</p>
          </CardBody>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            total={totalPages}
            page={currentPage}
            onChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}