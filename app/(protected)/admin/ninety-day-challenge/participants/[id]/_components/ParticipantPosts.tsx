"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Chip } from "@nextui-org/chip";
import { Pagination } from "@nextui-org/pagination";
import { Divider } from "@nextui-org/divider";
import { formatDistanceToNow } from "date-fns";

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
  _count: {
    reactions: number;
  };
}

interface Props {
  participantId: string;
  userId: string;
  challengeId: string;
  challengeStartDate: string;
}

export function ParticipantPosts({ participantId, userId, challengeId, challengeStartDate }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPosts();
  }, [currentPage]);

  const fetchPosts = async () => {
    try {
      const response = await fetch(
        `/api/admin/ninety-day-challenge/participants/${participantId}/posts?page=${currentPage}&limit=5`
      );
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching participant posts:', error);
    } finally {
      setLoading(false);
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
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Daily Posts</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3"></div>
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/4"></div>
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
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Daily Posts ({posts.length > 0 ? `${posts.length} recent` : 'No posts yet'})</h3>
      </CardHeader>
      <CardBody>
        {posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-zinc-500">No posts submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="space-y-4">
                {/* Post Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">
                      Day {Math.ceil((new Date(post.date).getTime() - new Date(challengeStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}
                    </h4>
                    <span className="text-sm text-zinc-500">
                      {new Date(post.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-500">
                    {formatDistanceToNow(new Date(post.createdAt))} ago
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {post.sleepHours && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-2 text-center">
                      <div className="text-purple-600 dark:text-purple-400 text-xs font-medium">Sleep</div>
                      <div className="text-purple-800 dark:text-purple-200 font-bold">{post.sleepHours}h</div>
                    </div>
                  )}
                  {post.mood && (
                    <div className={`border rounded-lg p-2 text-center ${
                      post.mood === 'EXCELLENT' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                      post.mood === 'VERY_GOOD' || post.mood === 'GOOD' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
                      post.mood === 'NEUTRAL' ? 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800' :
                      'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    }`}>
                      <div className={`text-xs font-medium ${
                        post.mood === 'EXCELLENT' ? 'text-green-600 dark:text-green-400' :
                        post.mood === 'VERY_GOOD' || post.mood === 'GOOD' ? 'text-blue-600 dark:text-blue-400' :
                        post.mood === 'NEUTRAL' ? 'text-gray-600 dark:text-gray-400' :
                        'text-yellow-600 dark:text-yellow-400'
                      }`}>Mood</div>
                      <div className={`font-bold ${
                        post.mood === 'EXCELLENT' ? 'text-green-800 dark:text-green-200' :
                        post.mood === 'VERY_GOOD' || post.mood === 'GOOD' ? 'text-blue-800 dark:text-blue-200' :
                        post.mood === 'NEUTRAL' ? 'text-gray-800 dark:text-gray-200' :
                        'text-yellow-800 dark:text-yellow-200'
                      }`}>{post.mood.toLowerCase().replace('_', ' ')}</div>
                    </div>
                  )}
                  {post.energy && (
                    <div className={`border rounded-lg p-2 text-center ${
                      post.energy === 'VERY_HIGH' || post.energy === 'HIGH' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                      post.energy === 'MODERATE' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
                      post.energy === 'LOW' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                      'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}>
                      <div className={`text-xs font-medium ${
                        post.energy === 'VERY_HIGH' || post.energy === 'HIGH' ? 'text-green-600 dark:text-green-400' :
                        post.energy === 'MODERATE' ? 'text-blue-600 dark:text-blue-400' :
                        post.energy === 'LOW' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>Energy</div>
                      <div className={`font-bold ${
                        post.energy === 'VERY_HIGH' || post.energy === 'HIGH' ? 'text-green-800 dark:text-green-200' :
                        post.energy === 'MODERATE' ? 'text-blue-800 dark:text-blue-200' :
                        post.energy === 'LOW' ? 'text-yellow-800 dark:text-yellow-200' :
                        'text-red-800 dark:text-red-200'
                      }`}>{post.energy.toLowerCase().replace('_', ' ')}</div>
                    </div>
                  )}
                  {post.sleepQuality && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-2 text-center">
                      <div className="text-indigo-600 dark:text-indigo-400 text-xs font-medium">Sleep Quality</div>
                      <div className="text-indigo-800 dark:text-indigo-200 font-bold">{post.sleepQuality.toLowerCase().replace('_', ' ')}</div>
                    </div>
                  )}
                  {post._count.reactions > 0 && (
                    <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg p-2 text-center">
                      <div className="text-pink-600 dark:text-pink-400 text-xs font-medium">Reactions</div>
                      <div className="text-pink-800 dark:text-pink-200 font-bold">{post._count.reactions}</div>
                    </div>
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
                    <h5 className="font-medium text-green-600 dark:text-green-400 mb-1">
                      🏆 Achievements
                    </h5>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{post.achievements}</p>
                  </div>
                )}

                {/* Challenges */}
                {post.challenges && (
                  <div>
                    <h5 className="font-medium text-orange-600 dark:text-orange-400 mb-1">
                      💪 Challenges
                    </h5>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{post.challenges}</p>
                  </div>
                )}

                {/* Meals */}
                {post.mealTracking && (
                  <div>
                    <h5 className="font-medium text-blue-600 dark:text-blue-400 mb-1">
                      🍽️ Meals
                    </h5>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{post.mealTracking}</p>
                  </div>
                )}

                {/* Photos */}
                {post.photos && post.photos.length > 0 && (
                  <div>
                    <h5 className="font-medium text-purple-600 dark:text-purple-400 mb-2">
                      📷 Progress Photos ({post.photos.length})
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {post.photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={photo}
                            alt={`Progress photo ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg cursor-pointer transition-transform hover:scale-105 shadow-sm"
                            onClick={() => window.open(photo, '_blank')}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Divider />
              </div>
            ))}

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
        )}
      </CardBody>
    </Card>
  );
}