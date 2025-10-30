"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useSidebarToggleContext } from "@/contexts/SidebarToggleContext";
import {
  IconBook,
  IconHelp,
} from "@tabler/icons-react";
import { GaugeIcon, type GaugeIconHandle } from "@/components/UI/gauge-icon";
import { ActivityIcon, type ActivityIconHandle } from "@/components/UI/activity-icon";
import { WorkoutIcon, type WorkoutIconHandle } from "@/components/UI/workout-icon";
import { ChallengeIcon, type ChallengeIconHandle } from "@/components/UI/challenge-icon";
import { UserIcon, type UserIconHandle } from "@/components/UI/user-icon";
import { BoxesIcon, type BoxesIconHandle } from "@/components/UI/boxes-icon";

interface BottomNavItemProps {
  icon: JSX.Element;
  label: string;
  href: string;
  active: boolean;
  iconRef?: React.RefObject<GaugeIconHandle | ActivityIconHandle | WorkoutIconHandle | ChallengeIconHandle | UserIconHandle | BoxesIconHandle>;
  onItemClick?: (href: string) => void;
}

function BottomNavItem({ icon, label, href, active, iconRef, onItemClick }: BottomNavItemProps) {
  const { mobileMenuOpen, toggleMobileMenu } = useSidebarToggleContext();

  const handleClick = (e: React.MouseEvent) => {
    // Immediate feedback - update active state instantly
    onItemClick?.(href);

    // Close mobile sidebar if open when navigating
    if (mobileMenuOpen) {
      toggleMobileMenu();
    }

    // Trigger animation for animated icons when clicked
    if (iconRef?.current) {
      iconRef.current.startAnimation();
      // Stop animation after a short delay
      setTimeout(() => {
        iconRef.current?.stopAnimation();
      }, 600);
    }

    // Add haptic feedback on supported devices
    if ('navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate(10); // Very short vibration for tactile feedback
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      prefetch={true} // Enable prefetching for faster navigation
      className={`flex flex-col items-center justify-center py-2 px-1 text-xs transition-colors duration-200 ${
        active
          ? 'text-primary'
          : 'text-zinc-600 dark:text-zinc-400 hover:text-primary dark:hover:text-primary'
      }`}
    >
      <div className={`mb-1 transition-transform duration-200 ${active ? 'scale-110' : 'scale-100'}`}>
        {icon}
      </div>
      <span className="font-medium leading-tight">{label}</span>
    </Link>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [activeItem, setActiveItem] = useState<string | null>(null);

  // Refs for animated icons
  const dashboardIconRef = useRef<GaugeIconHandle>(null);
  const activityIconRef = useRef<ActivityIconHandle>(null);
  const workoutIconRef = useRef<WorkoutIconHandle>(null);
  const challengeIconRef = useRef<ChallengeIconHandle>(null);
  const userIconRef = useRef<UserIconHandle>(null);
  const boxesIconRef = useRef<BoxesIconHandle>(null);

  useEffect(() => {
    async function checkUserStatus() {
      if (user) {
        try {
          // Check admin status
          const adminResponse = await fetch('/api/admin/check-auth');
          const adminData = await adminResponse.json();
          setIsAdmin(adminData.isAdmin);
        } catch (error) {
          console.error('Error checking user status:', error);
          setIsAdmin(false);
        } finally {
          setIsCheckingAdmin(false);
        }
      } else {
        setIsCheckingAdmin(false);
      }
    }
    checkUserStatus();
  }, [user]);

  // Aggressively prefetch all navigation routes when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Prefetch common routes for faster navigation
      const commonRoutes = [
        '/dashboard',
        '/activity',
        '/workout',
        '/ninety-day-challenge',
        '/profile',
        '/admin',
        '/admin/workouts',
        '/admin/users',
        '/admin/ninety-day-challenge'
      ];

      // Prefetch routes with a small delay to not block initial page load
      const timeoutId = setTimeout(() => {
        commonRoutes.forEach(route => {
          router.prefetch(route);
        });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [router]);

  // Reset activeItem when pathname changes (page loaded)
  useEffect(() => {
    setActiveItem(null);
  }, [pathname]);

  // Handle immediate feedback for navigation
  const handleItemClick = (href: string) => {
    setActiveItem(href);
  };

  // Helper function to determine if item is active (immediate feedback or actual pathname)
  const isItemActive = (href: string, pathCheck: boolean) => {
    if (activeItem === href) return true; // Immediate feedback
    if (activeItem && activeItem !== href) return false; // Another item was clicked
    return pathCheck; // Fall back to actual pathname check
  };

  // Define navigation items based on user role
  const getNavItems = () => {
    if (isAdmin) {
      return [
        {
          icon: <GaugeIcon ref={dashboardIconRef} size={20} />,
          label: "Dashboard",
          href: "/admin",
          active: isItemActive("/admin", pathname === "/admin"),
          iconRef: dashboardIconRef
        },
        {
          icon: <WorkoutIcon ref={workoutIconRef} size={20} />,
          label: "Workout",
          href: "/admin/workouts",
          active: isItemActive("/admin/workouts", pathname.startsWith("/admin/workouts")),
          iconRef: workoutIconRef
        },
        {
          icon: <BoxesIcon ref={boxesIconRef} size={20} />,
          label: "Users",
          href: "/admin/users",
          active: isItemActive("/admin/users", pathname.startsWith("/admin/users")),
          iconRef: boxesIconRef
        },
        {
          icon: <ChallengeIcon ref={challengeIconRef} size={20} />,
          label: "Challenge",
          href: "/admin/ninety-day-challenge",
          active: isItemActive("/admin/ninety-day-challenge", pathname.startsWith("/admin/ninety-day-challenge")),
          iconRef: challengeIconRef
        },
        {
          icon: <UserIcon ref={userIconRef} size={20} />,
          label: "Profile",
          href: "/profile",
          active: isItemActive("/profile", pathname === "/profile"),
          iconRef: userIconRef
        }
      ];
    } else {
      const baseItems = [
        {
          icon: <GaugeIcon ref={dashboardIconRef} size={20} />,
          label: "Dashboard",
          href: "/dashboard",
          active: isItemActive("/dashboard", pathname === "/dashboard"),
          iconRef: dashboardIconRef
        },
        {
          icon: <ActivityIcon ref={activityIconRef} size={20} />,
          label: "Activity",
          href: "/activity",
          active: isItemActive("/activity", pathname === "/activity"),
          iconRef: activityIconRef
        },
        {
          icon: <WorkoutIcon ref={workoutIconRef} size={20} />,
          label: "Workout",
          href: "/workout",
          active: isItemActive("/workout", pathname.startsWith("/workout")),
          iconRef: workoutIconRef
        }
      ];

      // Always show Challenge for all users - access control handled on page level
      baseItems.push({
        icon: <ChallengeIcon ref={challengeIconRef} size={20} />,
        label: "Challenge",
        href: "/ninety-day-challenge",
        active: isItemActive("/ninety-day-challenge", pathname.startsWith("/ninety-day-challenge")),
        iconRef: challengeIconRef
      });

      baseItems.push({
        icon: <UserIcon ref={userIconRef} size={20} />,
        label: "Profile",
        href: "/profile",
        active: isItemActive("/profile", pathname === "/profile"),
        iconRef: userIconRef
      });

      return baseItems;
    }
  };

  const navItems = getNavItems();

  // Don't render navigation while checking admin status to prevent flickering
  if (isCheckingAdmin) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shadow-lg">
      <div className={`grid h-16 ${navItems.length === 5 ? 'grid-cols-5' : 'grid-cols-4'}`}>
        {navItems.map((item) => (
          <BottomNavItem
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
            active={item.active}
            iconRef={item.iconRef}
            onItemClick={handleItemClick}
          />
        ))}
      </div>
      {/* Safe area spacing for devices with home indicator */}
      <div className="h-2 bg-white dark:bg-zinc-900"></div>
    </nav>
  );
}