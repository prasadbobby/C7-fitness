"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { User } from "@nextui-org/user";
import { Divider } from "@nextui-org/divider";
import { Pagination } from "@nextui-org/pagination";
import { Textarea } from "@nextui-org/input";
import DatePicker from "@/components/UI/DatePicker";
import { Modal, ModalContent, ModalBody, useDisclosure } from "@nextui-org/modal";
import { Avatar } from "@nextui-org/avatar";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/dropdown";
import { formatDistanceToNow, format } from "date-fns";
import {
  IconMessage2,
  IconSend,
  IconDots,
  IconTrash,
  IconCalendar,
  IconPhoto,
  IconX,
  IconHeart
} from "@tabler/icons-react";
import PostReactions, { ReactionType } from "@/components/UI/PostReactions";

interface PostReaction {
  id: string;
  type: string;
  participant: {
    userId: string;
  };
}

interface PostComment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    userId: string;
    firstName: string;
    lastName: string;
    imageUrl: string;
    username: string;
  };
}

interface Post {
  id: string;
  date: string;
  sleepHours: number | null;
  sleepQuality: string | null;
  mealTracking: string | null;
  dayDescription: string | null;
  mood: string | null;
  energy: string | null;
  achievements: string | null;
  challenges: string | null;
  photos: string[];
  createdAt: string;
  author: {
    userId: string;
    firstName: string;
    lastName: string;
    imageUrl: string;
    username: string;
    isAdmin?: boolean;
  };
  reactions: PostReaction[];
  comments: PostComment[];
  _count: {
    reactions: number;
    comments: number;
  };
  reactionCounts: Record<string, number>;
  userReaction: {
    id: string;
    type: string;
  } | null;
}

interface CommunityFeedProps {
  challengeId?: string;
}

export function CommunityFeed({ challengeId }: CommunityFeedProps = {}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string>('');

  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    fetchPosts();
  }, [currentPage, selectedDate, challengeId]);

  const fetchPosts = async () => {
    try {
      let url = `/api/ninety-day-challenge/community-feed?page=${currentPage}&limit=10`;
      if (selectedDate) {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        url += `&date=${dateStr}`;
      }
      if (challengeId) {
        url += `&challengeId=${challengeId}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
        setTotalPages(data.totalPages);
        setCurrentUserId(data.currentUserId || '');
      }
    } catch (error) {
      console.error('Error fetching community feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (postId: string, reactionType: ReactionType) => {
    try {
      const response = await fetch('/api/ninety-day-challenge/reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          type: reactionType,
        }),
      });

      if (response.ok) {
        fetchPosts(); // Refresh posts to show updated reactions
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleAddComment = async (postId: string) => {
    const content = newComments[postId]?.trim();
    if (!content) return;

    setCommentLoading(prev => ({ ...prev, [postId]: true }));

    try {
      const response = await fetch('/api/ninety-day-challenge/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          content,
        }),
      });

      if (response.ok) {
        setNewComments(prev => ({ ...prev, [postId]: '' }));
        fetchPosts(); // Refresh posts to show new comment
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setCommentLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/ninety-day-challenge/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPosts(); // Refresh posts to remove deleted comment
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleImageClick = (imageUrl: string) => {
    console.log('Image clicked:', imageUrl); // Debug log
    setSelectedImage(imageUrl);
    onOpen();
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
    setCurrentPage(1);
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

  const getDayNumber = (postDate: string, challengeStartDate?: string) => {
    const post = new Date(postDate);
    // For now, calculate from a fixed start date (can be made dynamic later)
    const challengeStart = challengeStartDate ? new Date(challengeStartDate) : new Date('2025-01-01');
    const daysDiff = Math.ceil((post.getTime() - challengeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, Math.min(90, daysDiff)); // Ensure it's between 1-90
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Community Feed</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-zinc-200 dark:bg-zinc-700 rounded-full"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3"></div>
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/4"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Date Filter Header */}
      <Card className="shadow-sm border border-zinc-200 dark:border-zinc-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between w-full">
            <div>
              <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">Community Feed</h3>
              <p className="text-sm text-zinc-500">Connect and motivate each other</p>
            </div>
            <div className="flex items-center gap-2">
              <DatePicker
                label="Filter by date"
                value={selectedDate || undefined}
                onChange={(date) => {
                  setSelectedDate(date);
                  setCurrentPage(1);
                }}
                size="sm"
                placeholder="Select a date..."
                className="w-48"
              />
              {selectedDate && (
                <Button
                  size="sm"
                  variant="light"
                  onPress={clearDateFilter}
                  startContent={<IconX size={14} />}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <Card className="shadow-sm border border-zinc-200 dark:border-zinc-700">
            <CardBody className="text-center py-12">
              <IconMessage2 size={48} className="text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-500 text-lg">No posts found</p>
              <p className="text-zinc-400 text-sm">
                {selectedDate ? 'Try selecting a different date or clear the filter' : 'Be the first to share your journey!'}
              </p>
            </CardBody>
          </Card>
        ) : (
          <>
            {posts.map((post) => (
              <Card key={post.id} className="shadow-sm border border-zinc-200 dark:border-zinc-700 hover:shadow-md transition-shadow">
                <CardBody className="p-6">
                  {/* Post Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <Avatar
                      src={post.author.imageUrl}
                      alt={`${post.author.firstName} ${post.author.lastName}`}
                      size="md"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {post.author.firstName} {post.author.lastName}
                        </p>
                        <span className="text-zinc-500 text-sm">•</span>
                        <span className="text-zinc-500 text-sm">
                          Day {getDayNumber(post.date)}
                        </span>
                        <span className="text-zinc-500 text-sm">•</span>
                        <span className="text-zinc-500 text-sm">
                          {formatDistanceToNow(new Date(post.createdAt))} ago
                        </span>
                      </div>
                      <p className="text-zinc-500 text-sm mt-0.5">
                        {format(new Date(post.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="space-y-4">
                    {/* Day Description */}
                    {post.dayDescription && (
                      <div>
                        <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed">
                          {post.dayDescription}
                        </p>
                      </div>
                    )}

                    {/* Stats - More compact Twitter-like badges */}
                    <div className="flex flex-wrap gap-2">
                      {post.sleepHours && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200">
                          😴 {post.sleepHours}h sleep
                        </span>
                      )}
                      {post.mood && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                          😊 {post.mood.toLowerCase().replace('_', ' ')} mood
                        </span>
                      )}
                      {post.energy && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
                          ⚡ {post.energy.toLowerCase().replace('_', ' ')} energy
                        </span>
                      )}
                      {post.sleepQuality && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200">
                          🛏️ {post.sleepQuality.toLowerCase().replace('_', ' ')} sleep
                        </span>
                      )}
                    </div>

                    {/* Achievements */}
                    {post.achievements && (
                      <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-50/50 dark:bg-green-900/20">
                        <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">
                          🏆 Achievements
                        </p>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300">{post.achievements}</p>
                      </div>
                    )}

                    {/* Challenges */}
                    {post.challenges && (
                      <div className="border-l-4 border-orange-500 pl-4 py-2 bg-orange-50/50 dark:bg-orange-900/20">
                        <p className="text-sm font-medium text-orange-700 dark:text-orange-400 mb-1">
                          💪 Challenges
                        </p>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300">{post.challenges}</p>
                      </div>
                    )}

                    {/* Meals */}
                    {post.mealTracking && (
                      <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50/50 dark:bg-blue-900/20">
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">
                          🍽️ Meals
                        </p>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300">{post.mealTracking}</p>
                      </div>
                    )}

                    {/* Photos */}
                    {post.photos && post.photos.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <IconPhoto size={16} className="text-zinc-500" />
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            {post.author.isAdmin
                              ? `Photos (${post.photos.length})`
                              : `Progress Photos (${post.photos.length})`
                            }
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {post.photos.map((photo, index) => (
                            <div key={index} className="relative group cursor-pointer">
                              <img
                                src={photo}
                                alt={post.author.isAdmin ? `Photo ${index + 1}` : `Progress photo ${index + 1}`}
                                className="w-full h-40 object-cover rounded-xl transition-all duration-200 hover:scale-[1.02]"
                                onClick={() => handleImageClick(photo)}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-xl flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <IconPhoto className="w-6 h-6 text-white" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar - DEV Community Style */}
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center gap-6">
                      {/* Enhanced Reactions */}
                      <PostReactions
                        postId={post.id}
                        reactions={post.reactionCounts || {}}
                        userReaction={post.userReaction?.type as ReactionType || null}
                        onReactionToggle={handleReaction}
                        size="sm"
                        showCounts={true}
                      />

                      {/* Comments */}
                      <button
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center gap-2 text-zinc-500 hover:text-blue-500 transition-colors group"
                      >
                        <IconMessage2 size={18} className="group-hover:text-blue-500" />
                        <span className="text-sm">{post._count.comments}</span>
                      </button>
                    </div>
                  </div>

                  {/* Comments Section */}
                  {expandedComments[post.id] && (
                    <div className="space-y-3 pt-4">
                      {/* Existing Comments */}
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar
                            src={comment.author.imageUrl}
                            alt={`${comment.author.firstName} ${comment.author.lastName}`}
                            size="sm"
                            className="flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl px-3 py-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                                  {comment.author.firstName} {comment.author.lastName}
                                </span>
                                <span className="text-xs text-zinc-500">
                                  {formatDistanceToNow(new Date(comment.createdAt))} ago
                                </span>
                              </div>
                              <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
                                {comment.content}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 mt-1 px-3">
                              <button className="text-zinc-500 hover:text-red-500 transition-colors text-xs">
                                <IconHeart size={14} className="inline mr-1" />
                                Like
                              </button>
                              {(comment.author.userId === currentUserId) && (
                                <Dropdown>
                                  <DropdownTrigger>
                                    <button className="text-zinc-500 hover:text-zinc-700 transition-colors">
                                      <IconDots size={14} />
                                    </button>
                                  </DropdownTrigger>
                                  <DropdownMenu>
                                    <DropdownItem
                                      key="delete"
                                      startContent={<IconTrash size={16} />}
                                      color="danger"
                                      onPress={() => handleDeleteComment(comment.id)}
                                    >
                                      Delete
                                    </DropdownItem>
                                  </DropdownMenu>
                                </Dropdown>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Add Comment */}
                      <div className="flex gap-3 pt-2">
                        <Avatar
                          size="sm"
                          className="flex-shrink-0"
                        />
                        <div className="flex-1">
                          <div className="flex gap-2">
                            <Textarea
                              placeholder="Write a comment..."
                              value={newComments[post.id] || ''}
                              onChange={(e) => setNewComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                              minRows={2}
                              maxRows={4}
                              className="flex-1"
                              variant="bordered"
                              classNames={{
                                input: "text-sm",
                                inputWrapper: "rounded-2xl border-zinc-300 dark:border-zinc-600"
                              }}
                            />
                            <Button
                              size="sm"
                              color="primary"
                              isLoading={commentLoading[post.id]}
                              onPress={() => handleAddComment(post.id)}
                              isDisabled={!newComments[post.id]?.trim()}
                              className="self-end mb-2 rounded-full"
                              isIconOnly
                            >
                              {!commentLoading[post.id] && <IconSend size={16} />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center pt-4">
            <Pagination
              total={totalPages}
              page={currentPage}
              onChange={setCurrentPage}
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Image Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="5xl"
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-sm",
          base: "max-w-none w-auto max-h-[95vh]",
          body: "p-0",
        }}
        hideCloseButton
      >
        <ModalContent className="bg-transparent shadow-none">
          <ModalBody className="p-0">
            {selectedImage && (
              <div className="relative flex items-center justify-center">
                <img
                  src={selectedImage}
                  alt="Photo preview"
                  className="max-w-full max-h-[90vh] object-contain rounded-lg"
                  onError={(e) => {
                    console.error('Image failed to load:', selectedImage);
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <Button
                  isIconOnly
                  color="default"
                  variant="solid"
                  className="absolute top-4 right-4 bg-black/70 text-white hover:bg-black/90"
                  onPress={onClose}
                >
                  <IconX size={20} />
                </Button>
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}