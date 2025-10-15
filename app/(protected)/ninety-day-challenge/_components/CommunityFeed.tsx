"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { User } from "@nextui-org/user";
import { Divider } from "@nextui-org/divider";
import { Pagination } from "@nextui-org/pagination";
import { Textarea } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { Slider } from "@nextui-org/slider";
import DatePicker from "@/components/UI/DatePicker";
import { Avatar } from "@nextui-org/avatar";
import { formatDistanceToNow, format } from "date-fns";
import {
  IconMessage2,
  IconSend,
  IconDots,
  IconTrash,
  IconPhoto,
  IconX,
  IconHeart,
  IconEdit,
  IconEye,
  IconPin,
  IconPinFilled,
  IconCamera
} from "@tabler/icons-react";
import PostReactions, { ReactionType } from "@/components/UI/PostReactions";
import { ImageModal } from "@/components/UI/ImageModal";
import { DeleteConfirmationModal } from "@/components/UI/ConfirmationModal";
import BottomSheet from "@/components/UI/BottomSheet";
import { processUploadedFiles } from "@/utils/imageUtils";

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
  reactionCounts: Record<string, number>;
  userReaction: {
    id: string;
    type: string;
  } | null;
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
  updatedAt: string;
  isPinned?: boolean;
  pinnedAt?: string | null;
  pinnedBy?: string | null;
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
    comments: number;
  };
  reactionCounts: Record<string, number>;
  reactionsByType: Record<string, Array<{
    userId: string;
    firstName: string;
    lastName: string;
    imageUrl: string;
    username: string;
    isAdmin: boolean;
  }>>;
  userReaction: {
    id: string;
    type: string;
  } | null;
}

interface CommunityFeedProps {
  challengeId?: string;
  showTodayByDefault?: boolean;
  isAdmin?: boolean;
}

export function CommunityFeed({ challengeId, showTodayByDefault = false, isAdmin = false }: CommunityFeedProps = {}) {
  const [posts, setPosts] = useState<Post[]>([]);

  // Form options
  const sleepQualityOptions = [
    { key: "POOR", label: "Poor" },
    { key: "FAIR", label: "Fair" },
    { key: "GOOD", label: "Good" },
    { key: "VERY_GOOD", label: "Very Good" },
    { key: "EXCELLENT", label: "Excellent" },
  ];

  const moodOptions = [
    { key: "VERY_LOW", label: "Very Low" },
    { key: "LOW", label: "Low" },
    { key: "NEUTRAL", label: "Neutral" },
    { key: "GOOD", label: "Good" },
    { key: "VERY_GOOD", label: "Very Good" },
    { key: "EXCELLENT", label: "Excellent" },
  ];

  const energyOptions = [
    { key: "VERY_LOW", label: "Very Low" },
    { key: "LOW", label: "Low" },
    { key: "MODERATE", label: "Moderate" },
    { key: "HIGH", label: "High" },
    { key: "VERY_HIGH", label: "Very High" },
  ];
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(showTodayByDefault ? new Date() : null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [initialImageIndex, setInitialImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPostForAction, setSelectedPostForAction] = useState<Post | null>(null);
  const [editFormData, setEditFormData] = useState({
    sleepHours: 8,
    sleepQuality: '',
    mealTracking: '',
    dayDescription: '',
    mood: '',
    energy: '',
    achievements: '',
    challenges: '',
    existingPhotos: [] as string[],
    newPhotos: [] as File[]
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isPostViewsModalOpen, setIsPostViewsModalOpen] = useState(false);
  const [postViewsData, setPostViewsData] = useState<{views: any[], totalViews: number} | null>(null);
  const [loadingPostViews, setLoadingPostViews] = useState(false);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Helper functions for photo management
  const handleNewPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      try {
        // Process files to convert HEIC to JPEG if necessary
        const processedFiles = await processUploadedFiles(files);
        setEditFormData(prev => ({
          ...prev,
          newPhotos: [...prev.newPhotos, ...processedFiles]
        }));
      } catch (error) {
        console.error('Error processing uploaded files:', error);
        alert('Some images could not be processed. Please try again.');
      }
    }
  };

  const removeExistingPhoto = (index: number) => {
    setEditFormData(prev => ({
      ...prev,
      existingPhotos: prev.existingPhotos.filter((_, i) => i !== index)
    }));
  };

  const removeNewPhoto = (index: number) => {
    setEditFormData(prev => ({
      ...prev,
      newPhotos: prev.newPhotos.filter((_, i) => i !== index)
    }));
  };

  const resetEditFormData = () => {
    setEditFormData({
      sleepHours: 8,
      sleepQuality: '',
      mealTracking: '',
      dayDescription: '',
      mood: '',
      energy: '',
      achievements: '',
      challenges: '',
      existingPhotos: [],
      newPhotos: []
    });
  };

  // Helper function to check if any changes have been made to the post
  const hasPostChanges = () => {
    if (!selectedPostForAction) return false;

    const original = selectedPostForAction;
    const current = editFormData;

    // Check if photos have changed
    const photosChanged =
      current.newPhotos.length > 0 ||
      current.existingPhotos.length !== original.photos.length ||
      !current.existingPhotos.every((photo, index) => photo === original.photos[index]);

    // For admin editing their own posts, only check dayDescription and photos
    if (isAdmin && selectedPostForAction?.author.isAdmin) {
      return current.dayDescription !== (original.dayDescription || '') || photosChanged;
    }

    // For regular users or admin editing user posts, check all fields
    const fieldsChanged =
      current.sleepHours !== (original.sleepHours || 8) ||
      current.sleepQuality !== (original.sleepQuality || '') ||
      current.mealTracking !== (original.mealTracking || '') ||
      current.dayDescription !== (original.dayDescription || '') ||
      current.mood !== (original.mood || '') ||
      current.energy !== (original.energy || '') ||
      current.achievements !== (original.achievements || '') ||
      current.challenges !== (original.challenges || '');

    return fieldsChanged || photosChanged;
  };

  useEffect(() => {
    fetchPosts();
  }, [currentPage, selectedDate, challengeId]);

  // Auto-record post views when posts are loaded
  useEffect(() => {
    if (posts.length > 0) {
      recordPostViews();
    }
  }, [posts]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && dropdownRefs.current[openDropdown]) {
        if (!dropdownRefs.current[openDropdown]?.contains(event.target as Node)) {
          setOpenDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

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

  const recordPostViews = async () => {
    // Record views for all visible posts
    for (const post of posts) {
      try {
        await fetch(`/api/ninety-day-challenge/posts/${post.id}/views`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        // Silently fail for individual view recordings to not affect user experience
        console.debug('Error recording view for post:', post.id, error);
      }
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

  const handleCommentReaction = async (commentId: string, reactionType: ReactionType) => {
    try {
      const response = await fetch(`/api/ninety-day-challenge/comments/${commentId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: reactionType,
        }),
      });

      if (response.ok) {
        fetchPosts(); // Refresh posts to show updated comment reactions
      }
    } catch (error) {
      console.error('Error adding comment reaction:', error);
    }
  };

  const handleDeletePost = async () => {
    if (!selectedPostForAction) return;

    try {
      const response = await fetch(`/api/ninety-day-challenge/posts/${selectedPostForAction.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPosts(); // Refresh posts to remove deleted post
        setIsDeleteModalOpen(false);
        setSelectedPostForAction(null);
      } else {
        alert('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Error deleting post');
    }
  };

  const handleEditPost = (post: Post) => {
    setSelectedPostForAction(post);
    setEditFormData({
      sleepHours: post.sleepHours || 8,
      sleepQuality: post.sleepQuality || '',
      mealTracking: post.mealTracking || '',
      dayDescription: post.dayDescription || '',
      mood: post.mood || '',
      energy: post.energy || '',
      achievements: post.achievements || '',
      challenges: post.challenges || '',
      existingPhotos: post.photos || [],
      newPhotos: []
    });
    setIsEditModalOpen(true);
    setOpenDropdown(null);
  };

  const handleSubmitEdit = async () => {
    if (!selectedPostForAction) return;

    setIsSubmittingEdit(true);
    try {
      // Check if we have new photos or need to handle photo changes
      const hasPhotoChanges = editFormData.newPhotos.length > 0 ||
        editFormData.existingPhotos.length !== selectedPostForAction.photos.length ||
        !editFormData.existingPhotos.every((photo, index) => photo === selectedPostForAction.photos[index]);

      let response;

      if (hasPhotoChanges) {
        // Use FormData when there are photo changes
        const formData = new FormData();

        if (isAdmin && selectedPostForAction?.author.isAdmin) {
          // Admin editing their own post - only basic content
          formData.append('dayDescription', editFormData.dayDescription);
        } else {
          // User editing their post OR admin editing user post - all fields
          formData.append('sleepHours', editFormData.sleepHours.toString());
          formData.append('sleepQuality', editFormData.sleepQuality);
          formData.append('mealTracking', editFormData.mealTracking);
          formData.append('dayDescription', editFormData.dayDescription);
          formData.append('mood', editFormData.mood);
          formData.append('energy', editFormData.energy);
          formData.append('achievements', editFormData.achievements);
          formData.append('challenges', editFormData.challenges);
        }

        // Add existing photos that weren't removed
        formData.append('existingPhotos', JSON.stringify(editFormData.existingPhotos));

        // Add new photos
        editFormData.newPhotos.forEach((photo) => {
          formData.append('newPhotos', photo);
        });

        response = await fetch(`/api/ninety-day-challenge/posts/${selectedPostForAction.id}`, {
          method: 'PUT',
          body: formData,
        });
      } else {
        // Use JSON when no photo changes (existing behavior)
        response = await fetch(`/api/ninety-day-challenge/posts/${selectedPostForAction.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify((isAdmin && selectedPostForAction?.author.isAdmin) ? {
            // Admin editing their own post - only basic content
            dayDescription: editFormData.dayDescription,
          } : {
            // User editing their post OR admin editing user post - all fields
            sleepHours: editFormData.sleepHours,
            sleepQuality: editFormData.sleepQuality,
            mealTracking: editFormData.mealTracking,
            dayDescription: editFormData.dayDescription,
            mood: editFormData.mood,
            energy: editFormData.energy,
            achievements: editFormData.achievements,
            challenges: editFormData.challenges,
          }),
        });
      }

      if (response.ok) {
        fetchPosts(); // Refresh posts to show updated post
        setIsEditModalOpen(false);
        setSelectedPostForAction(null);
        resetEditFormData();
      } else {
        alert('Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Error updating post');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const openDeleteModal = (post: Post) => {
    setSelectedPostForAction(post);
    setIsDeleteModalOpen(true);
    setOpenDropdown(null);
  };

  const handleViewPostViews = async (post: Post) => {
    setSelectedPostForAction(post);
    setLoadingPostViews(true);
    setIsPostViewsModalOpen(true);
    setOpenDropdown(null);

    try {
      const response = await fetch(`/api/ninety-day-challenge/posts/${post.id}/views`);
      if (response.ok) {
        const data = await response.json();
        setPostViewsData(data);
      } else {
        console.error('Failed to fetch post views');
        setPostViewsData({ views: [], totalViews: 0 });
      }
    } catch (error) {
      console.error('Error fetching post views:', error);
      setPostViewsData({ views: [], totalViews: 0 });
    } finally {
      setLoadingPostViews(false);
    }
  };

  const toggleDropdown = (postId: string) => {
    setOpenDropdown(openDropdown === postId ? null : postId);
  };

  const handlePinToggle = async (post: Post) => {
    try {
      const response = await fetch(`/api/ninety-day-challenge/posts/${post.id}/pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data.message);
        fetchPosts(); // Refresh posts to show updated pin status
        setOpenDropdown(null);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update pin status');
      }
    } catch (error) {
      console.error('Error toggling pin status:', error);
      alert('Error updating pin status');
    }
  };

  const handleImageClick = (images: string[], clickedIndex: number) => {
    setSelectedImages(images);
    setInitialImageIndex(clickedIndex);
    setIsImageModalOpen(true);
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

  const isPostEdited = (post: Post) => {
    // Check if the post was updated after creation (with a small buffer for normal save operations)
    const created = new Date(post.createdAt).getTime();
    const updated = new Date(post.updatedAt).getTime();
    return updated > created + 5000; // 5 second buffer
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
            <div className="flex-shrink-0">
              <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">Community Feed</h3>
              <p className="text-sm text-zinc-500">Connect and motivate each other</p>
            </div>
            <div className="flex items-center gap-2 sm:min-w-0 sm:flex-shrink-0">
              <DatePicker
                label="Filter by date"
                value={selectedDate || undefined}
                onChange={(date) => {
                  setSelectedDate(date || null);
                  setCurrentPage(1);
                }}
                size="sm"
                placeholder="Select a date..."
                className="flex-1 sm:w-48 min-w-0"
              />
              {selectedDate && (
                <Button
                  size="sm"
                  variant="light"
                  onPress={clearDateFilter}
                  startContent={<IconX size={14} />}
                  className="flex-shrink-0 whitespace-nowrap"
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
                      {/* First line: Name, Admin badge, Pinned badge, Day */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {post.author.firstName} {post.author.lastName}
                        </p>
                        {post.author.isAdmin && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200">
                            Admin
                          </span>
                        )}
                        {post.isPinned && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200">
                            <IconPinFilled size={12} />
                            Pinned
                          </span>
                        )}
                        {isPostEdited(post) && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200">
                            Edited
                          </span>
                        )}
                        <span className="text-zinc-500 text-sm">•</span>
                        <span className="text-zinc-500 text-sm">
                          Day {getDayNumber(post.date)}
                        </span>
                      </div>

                      {/* Second line: Date and timestamps */}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-zinc-500 text-sm">
                          {format(new Date(post.date), 'MMM d, yyyy')}
                        </span>
                        <span className="text-zinc-400 text-sm">•</span>
                        <span className="text-zinc-500 text-sm">
                          {isPostEdited(post)
                            ? `${formatDistanceToNow(new Date(post.updatedAt))} ago`
                            : `${formatDistanceToNow(new Date(post.createdAt))} ago`
                          }
                        </span>
                      </div>
                    </div>

                    {/* Post Menu - Available for all users */}
                    <div className="relative" ref={(el) => dropdownRefs.current[post.id] = el}>
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        className="text-zinc-500 hover:text-zinc-700"
                        onPress={() => toggleDropdown(post.id)}
                      >
                        <IconDots size={16} />
                      </Button>

                      {/* Custom Dropdown Menu */}
                      {openDropdown === post.id && (
                        <div className="absolute right-0 top-8 z-50 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg py-1 min-w-[140px]">
                          {/* Post Views - Available for all users */}
                          <button
                            onClick={() => handleViewPostViews(post)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                          >
                            <IconEye size={16} />
                            Post Views
                          </button>

                          {/* Pin/Unpin option - Available for admins only */}
                          {isAdmin && (
                            <button
                              onClick={() => handlePinToggle(post)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                            >
                              {post.isPinned ? (
                                <>
                                  <IconPin size={16} />
                                  Unpin Post
                                </>
                              ) : (
                                <>
                                  <IconPinFilled size={16} />
                                  Pin Post
                                </>
                              )}
                            </button>
                          )}

                          {/* Edit and Delete options - Available for admins and post owners */}
                          {(isAdmin || post.author.userId === currentUserId) && (
                            <>
                              <button
                                onClick={() => handleEditPost(post)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                              >
                                <IconEdit size={16} />
                                Edit Post
                              </button>
                              <button
                                onClick={() => openDeleteModal(post)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              >
                                <IconTrash size={16} />
                                Delete Post
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="space-y-4">
                    {/* Day Description */}
                    {post.dayDescription && (
                      <div>
                        <div className="text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                          {post.dayDescription}
                        </div>
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
                            <div
                              key={index}
                              className="relative group cursor-pointer overflow-hidden rounded-xl"
                              onClick={() => handleImageClick(post.photos, index)}
                            >
                              <img
                                src={photo}
                                alt={post.author.isAdmin ? `Photo ${index + 1}` : `Progress photo ${index + 1}`}
                                className="w-full h-40 object-cover transition-transform duration-200 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 rounded-full p-2">
                                  <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                  </svg>
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
                        reactionUsers={post.reactionsByType || {}}
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
                              <button
                                onClick={() => handleCommentReaction(comment.id, "LIKE")}
                                className={`flex items-center gap-1 text-xs transition-colors ${
                                  comment.userReaction?.type === "LIKE"
                                    ? "text-red-500"
                                    : "text-zinc-500 hover:text-red-500"
                                }`}
                              >
                                <IconHeart
                                  size={14}
                                  className={comment.userReaction?.type === "LIKE" ? "fill-current" : ""}
                                />
                                <span>
                                  {comment.reactionCounts?.LIKE || 0 > 0
                                    ? `${comment.reactionCounts.LIKE} Like${comment.reactionCounts.LIKE !== 1 ? 's' : ''}`
                                    : 'Like'
                                  }
                                </span>
                              </button>
                              {(comment.author.userId === currentUserId) && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-zinc-500 hover:text-red-500 transition-colors text-xs"
                                >
                                  <IconTrash size={14} className="inline mr-1" />
                                  Delete
                                </button>
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
      <ImageModal
        images={selectedImages}
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        initialIndex={initialImageIndex}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedPostForAction(null);
        }}
        onConfirm={handleDeletePost}
        itemName={selectedPostForAction ? `post from ${selectedPostForAction.author.firstName} ${selectedPostForAction.author.lastName}` : 'this post'}
        itemType="post"
      />

      {/* Edit Post Modal */}
      <BottomSheet
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPostForAction(null);
          resetEditFormData();
        }}
        title="Edit Post"
        subtitle={selectedPostForAction ? `Edit post from ${format(new Date(selectedPostForAction.date), 'MMM d, yyyy')}` : ''}
        size="2xl"
        footer={
          <>
            <Button
              variant="light"
              onPress={() => {
                setIsEditModalOpen(false);
                setSelectedPostForAction(null);
                resetEditFormData();
              }}
              isDisabled={isSubmittingEdit}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSubmitEdit}
              isLoading={isSubmittingEdit}
              isDisabled={!hasPostChanges()}
              className="font-medium"
            >
              Update Post
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {isAdmin && selectedPostForAction?.author.isAdmin ? (
            // Admin Edit Form - Simple
            <>
              {/* Post Content */}
              <Textarea
                label="What's happening?"
                placeholder="Share an update, motivation, or announcement with the community..."
                value={editFormData.dayDescription}
                onChange={(e) => setEditFormData(prev => ({ ...prev, dayDescription: e.target.value }))}
                minRows={4}
                maxRows={8}
                isRequired
                classNames={{
                  input: "text-base",
                  inputWrapper: "border-2 border-zinc-200 dark:border-zinc-700 hover:border-primary-300 focus-within:border-primary-500"
                }}
              />

              {/* Photo Management Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <IconCamera size={20} className="text-zinc-500" />
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Photos
                  </label>
                </div>

                {/* Existing Photos */}
                {editFormData.existingPhotos.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Current Photos
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {editFormData.existingPhotos.map((photo, index) => (
                        <div key={`existing-${index}`} className="relative">
                          <img
                            src={photo}
                            alt={`Existing photo ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <Button
                            isIconOnly
                            size="sm"
                            color="danger"
                            variant="faded"
                            className="absolute top-1 right-1"
                            onPress={() => removeExistingPhoto(index)}
                          >
                            <IconX size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Photos */}
                {editFormData.newPhotos.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      New Photos
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {editFormData.newPhotos.map((photo, index) => (
                        <div key={`new-${index}`} className="relative">
                          <img
                            src={URL.createObjectURL(photo)}
                            alt={`New photo ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <Button
                            isIconOnly
                            size="sm"
                            color="danger"
                            variant="faded"
                            className="absolute top-1 right-1"
                            onPress={() => removeNewPhoto(index)}
                          >
                            <IconX size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Photos */}
                <input
                  type="file"
                  multiple
                  accept="image/*,.heic,.HEIC"
                  onChange={handleNewPhotoUpload}
                  className="block w-full text-sm text-zinc-500 dark:text-zinc-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary-50 file:text-primary-700
                    hover:file:bg-primary-100
                    dark:file:bg-primary-900/50 dark:file:text-primary-300"
                />
              </div>
            </>
          ) : (
            // User Post Edit Form - Complete (shown for user posts or when non-admin is editing)
            <div className="space-y-6">
              {/* Sleep Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-zinc-800 dark:text-zinc-200">Sleep Tracking</h4>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Sleep Hours: {editFormData.sleepHours}h</label>
                  <Slider
                    size="sm"
                    step={0.5}
                    minValue={0}
                    maxValue={12}
                    value={editFormData.sleepHours}
                    onChange={(value) => setEditFormData(prev => ({ ...prev, sleepHours: value as number }))}
                    className="w-full"
                  />
                </div>

                <Select
                  label="Sleep Quality"
                  placeholder="Select sleep quality"
                  selectedKeys={editFormData.sleepQuality ? [editFormData.sleepQuality] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setEditFormData(prev => ({ ...prev, sleepQuality: selected }));
                  }}
                >
                  {sleepQualityOptions.map((option) => (
                    <SelectItem key={option.key} value={option.key}>
                      {option.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Meals Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-zinc-800 dark:text-zinc-200">Meal Tracking</h4>
                <Textarea
                  placeholder="Describe your meals today..."
                  value={editFormData.mealTracking}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, mealTracking: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Mood & Energy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Mood"
                  placeholder="Select your mood"
                  selectedKeys={editFormData.mood ? [editFormData.mood] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setEditFormData(prev => ({ ...prev, mood: selected }));
                  }}
                >
                  {moodOptions.map((option) => (
                    <SelectItem key={option.key} value={option.key}>
                      {option.label}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="Energy Level"
                  placeholder="Select your energy level"
                  selectedKeys={editFormData.energy ? [editFormData.energy] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setEditFormData(prev => ({ ...prev, energy: selected }));
                  }}
                >
                  {energyOptions.map((option) => (
                    <SelectItem key={option.key} value={option.key}>
                      {option.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Day Description */}
              <Textarea
                label="How was your day?"
                placeholder="Tell us about your day..."
                value={editFormData.dayDescription}
                onChange={(e) => setEditFormData(prev => ({ ...prev, dayDescription: e.target.value }))}
                rows={3}
              />

              {/* Achievements & Challenges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea
                  label="Today's Achievements"
                  placeholder="What did you accomplish?"
                  value={editFormData.achievements}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, achievements: e.target.value }))}
                  rows={2}
                />

                <Textarea
                  label="Challenges Faced"
                  placeholder="What was difficult today?"
                  value={editFormData.challenges}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, challenges: e.target.value }))}
                  rows={2}
                />
              </div>

              {/* Photo Management Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <IconCamera size={20} className="text-zinc-500" />
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Progress Photos
                  </label>
                </div>

                {/* Existing Photos */}
                {editFormData.existingPhotos.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Current Photos
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {editFormData.existingPhotos.map((photo, index) => (
                        <div key={`existing-${index}`} className="relative">
                          <img
                            src={photo}
                            alt={`Existing photo ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <Button
                            isIconOnly
                            size="sm"
                            color="danger"
                            variant="faded"
                            className="absolute top-1 right-1"
                            onPress={() => removeExistingPhoto(index)}
                          >
                            <IconX size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Photos */}
                {editFormData.newPhotos.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      New Photos
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {editFormData.newPhotos.map((photo, index) => (
                        <div key={`new-${index}`} className="relative">
                          <img
                            src={URL.createObjectURL(photo)}
                            alt={`New photo ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <Button
                            isIconOnly
                            size="sm"
                            color="danger"
                            variant="faded"
                            className="absolute top-1 right-1"
                            onPress={() => removeNewPhoto(index)}
                          >
                            <IconX size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Photos */}
                <input
                  type="file"
                  multiple
                  accept="image/*,.heic,.HEIC"
                  onChange={handleNewPhotoUpload}
                  className="block w-full text-sm text-zinc-500 dark:text-zinc-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary-50 file:text-primary-700
                    hover:file:bg-primary-100
                    dark:file:bg-primary-900/50 dark:file:text-primary-300"
                />
              </div>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Post Views BottomSheet */}
      <BottomSheet
        isOpen={isPostViewsModalOpen}
        onClose={() => {
          setIsPostViewsModalOpen(false);
          setSelectedPostForAction(null);
          setPostViewsData(null);
        }}
        title="Post Views"
        subtitle={selectedPostForAction ? `Who viewed this post` : ''}
        size="md"
      >
        <div className="space-y-3 pb-4">
          {loadingPostViews ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : postViewsData && postViewsData.views.length > 0 ? (
            <>
              <div className="text-sm text-zinc-500 mb-4">
                {postViewsData.totalViews} {postViewsData.totalViews === 1 ? 'view' : 'views'}
              </div>
              {postViewsData.views.map((view) => (
                <div key={view.id} className="flex items-center gap-3">
                  <Avatar
                    src={view.user.imageUrl}
                    alt={`${view.user.firstName} ${view.user.lastName}`}
                    size="sm"
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {view.user.firstName} {view.user.lastName}
                      </p>
                      {view.user.isAdmin && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {view.user.username && (
                        <p className="text-xs text-foreground-500">@{view.user.username}</p>
                      )}
                      <p className="text-xs text-foreground-500">
                        Viewed {formatDistanceToNow(new Date(view.viewedAt))} ago
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-8">
              <IconEye size={48} className="text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-500">No views yet</p>
              <p className="text-zinc-400 text-sm">Be the first to view this post!</p>
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}