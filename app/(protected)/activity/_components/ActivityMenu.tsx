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
  const [position, setPosition] = useState({ top: 0, left: 0 });
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

  const updatePosition = () => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right + window.scrollX - 180
      });
    }
  };

  // Update position when dropdown opens
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);
    }

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isOpen]);

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
        className="shrink-0 z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap font-normal subpixel-antialiased overflow-hidden tap-highlight-transparent outline-none data-[focus-visible=true]:z-10 data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-focus data-[focus-visible=true]:outline-offset-2 text-tiny gap-unit-2 rounded-small px-unit-0 !gap-unit-0 data-[pressed=true]:scale-[0.97] transition-transform-colors-opacity motion-reduce:transition-none bg-transparent text-foreground min-w-unit-8 w-unit-8 h-unit-8 data-[hover=true]:opacity-hover p-1"
        onClick={toggleMenu}
        aria-label="Activity actions"
      >
        <IconMenu2 className="text-black dark:text-primary" size={22} />
      </button>

      {isOpen && (
        <div className="fixed z-[99999] min-w-[180px] bg-content1 shadow-large rounded-large border border-divider backdrop-blur-md backdrop-saturate-150 py-1"
             style={{
               top: `${position.top}px`,
               left: `${position.left}px`
             }}>
          {/* Header */}
          <div className="px-2 py-1.5 border-b border-divider">
            <h4 className="text-zinc-500 uppercase font-semibold text-xs">
              Activity Actions
            </h4>
          </div>

          {/* View Details */}
          <button
            className="relative flex w-full cursor-pointer select-none items-center rounded-small px-2 py-1.5 text-small subpixel-antialiased outline-none transition-colors hover:bg-default-100 active:bg-default-200 data-[hover=true]:bg-default-100 data-[selectable=true]:focus:bg-default-100 data-[pressed=true]:opacity-70 data-[focus-visible=true]:z-10 data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-focus data-[focus-visible=true]:outline-offset-2 text-foreground tap-highlight-transparent gap-2"
            onClick={handleViewDetails}
          >
            <IconInfoCircle size={20} />
            View Details
          </button>

          {/* Divider */}
          <div className="border-t border-divider my-1"></div>

          {/* Delete */}
          <button
            className="relative flex w-full cursor-pointer select-none items-center rounded-small px-2 py-1.5 text-small subpixel-antialiased outline-none transition-colors hover:bg-danger-50 active:bg-danger-100 data-[hover=true]:bg-danger-50 data-[selectable=true]:focus:bg-danger-50 data-[pressed=true]:opacity-70 data-[focus-visible=true]:z-10 data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-focus data-[focus-visible=true]:outline-offset-2 text-danger tap-highlight-transparent gap-2"
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
