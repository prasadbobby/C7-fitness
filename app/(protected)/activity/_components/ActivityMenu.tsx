"use client";
import { useContext, useState, useRef, useEffect } from "react";
import { ActivityModalContext } from "@/contexts/ActivityModalContext";
import { handleDeleteActivity } from "@/server-actions/ActivityServerActions";
import { TrackingType } from "@prisma/client";
import {
  IconInfoCircle,
  IconMenu2,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";

interface Set {
  weight: number | null;
  reps: number | null;
  exerciseDuration: number | null;
}

interface Exercise {
  id: string;
  exerciseId: string;
  trackingType: TrackingType;
  Exercise: {
    name: string;
  };
  sets: Set[];
}

interface WorkoutPlan {
  name: string;
}

interface Activity {
  id: string;
  duration: number;
  date: Date;
  WorkoutPlan: WorkoutPlan;
  exercises: Exercise[];
}

export default function ActivityMenu({ activity }: { activity: Activity }) {
  const { setActivity, onOpen } = useContext(ActivityModalContext);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleDelete = async (activityId: string) => {
    const response = await handleDeleteActivity(activityId);
    if (response.success) {
      toast.success(response.message);
    } else {
      toast.error(response.message);
    }
  };

  const handleViewDetails = () => {
    setActivity(activity);
    onOpen();
    setIsOpen(false);
  };

  const handleDeleteClick = () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this activity?",
    );
    if (confirmDelete) {
      handleDelete(activity.id);
    }
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="shrink-0 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        onClick={toggleMenu}
        aria-label="Activity actions"
      >
        <IconMenu2 className="text-black dark:text-primary" size={22} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-8 z-99 min-w-[180px] bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
          {/* Header */}
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-zinc-500 uppercase font-semibold text-xs">
              Activity Actions
            </h4>
          </div>

          {/* View Details */}
          <button
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            onClick={handleViewDetails}
          >
            <IconInfoCircle size={20} />
            View Details
          </button>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

          {/* Delete */}
          <button
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            onClick={handleDeleteClick}
          >
            <IconTrash size={20} />
            Delete Activity
          </button>
        </div>
      )}
    </div>
  );
}
