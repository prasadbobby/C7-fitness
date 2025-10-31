"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useSidebarToggleContext } from "@/contexts/SidebarToggleContext";
import { GaugeIcon, type GaugeIconHandle } from "@/components/UI/gauge-icon";
import { ActivityIcon, type ActivityIconHandle } from "@/components/UI/activity-icon";
import { WorkoutIcon, type WorkoutIconHandle } from "@/components/UI/workout-icon";
import { ChallengeIcon, type ChallengeIconHandle } from "@/components/UI/challenge-icon";
import { UserIcon, type UserIconHandle } from "@/components/UI/user-icon";
import { BoxesIcon, type BoxesIconHandle } from "@/components/UI/boxes-icon";

interface NavItemProps {
  icon: JSX.Element;
  label: string;
  href: string;
  active: boolean;
  color: string;
  iconRef?: React.RefObject<GaugeIconHandle | ActivityIconHandle | WorkoutIconHandle | ChallengeIconHandle | UserIconHandle | BoxesIconHandle>;
  onItemClick?: (href: string) => void;
}

function AnimatedNavItem({ icon, label, href, active, color, iconRef, onItemClick }: NavItemProps) {
  const { mobileMenuOpen, toggleMobileMenu } = useSidebarToggleContext();

  const handleClick = () => {
    onItemClick?.(href);

    if (mobileMenuOpen) {
      toggleMobileMenu();
    }

    if (iconRef?.current) {
      iconRef.current.startAnimation();
      setTimeout(() => {
        iconRef.current?.stopAnimation();
      }, 600);
    }

    if ('navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      prefetch={true}
      className={`
        relative flex items-center justify-center px-3 py-2 mx-1 rounded-full cursor-pointer
        transition-all duration-400 ease-in-out
        ${active
          ? `${color} shadow-lg transform scale-105`
          : 'bg-transparent hover:bg-content2/50'
        }
      `}
    >
      <div className={`
        flex items-center justify-center transition-all duration-300
        text-foreground-500
      `}>
        <div className="text-lg">
          {icon}
        </div>
        <span className={`
          font-semibold text-xs ml-2 overflow-hidden whitespace-nowrap
          transition-all duration-400 ease-in-out
          ${active ? 'max-w-[100px] opacity-100' : 'max-w-0 opacity-0'}
        `}>
          {label}
        </span>
      </div>
    </Link>
  );
}

export default function AnimatedBottomNav() {
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
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

      const timeoutId = setTimeout(() => {
        commonRoutes.forEach(route => {
          router.prefetch(route);
        });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [router]);

  useEffect(() => {
    setActiveItem(null);
  }, [pathname]);

  const handleItemClick = (href: string) => {
    setActiveItem(href);
  };

  const isItemActive = (href: string, pathCheck: boolean) => {
    if (activeItem === href) return true;
    if (activeItem && activeItem !== href) return false;
    return pathCheck;
  };

  // Single consistent color for all active tabs
  const activeTabColor = 'bg-primary/20';

  const getNavItems = () => {
    if (isAdmin) {
      return [
        {
          icon: <GaugeIcon ref={dashboardIconRef} size={20} />,
          label: "Dashboard",
          href: "/admin",
          active: isItemActive("/admin", pathname === "/admin"),
          color: activeTabColor,
          iconRef: dashboardIconRef
        },
        {
          icon: <WorkoutIcon ref={workoutIconRef} size={20} />,
          label: "Workout",
          href: "/admin/workouts",
          active: isItemActive("/admin/workouts", pathname.startsWith("/admin/workouts")),
          color: activeTabColor,
          iconRef: workoutIconRef
        },
        {
          icon: <BoxesIcon ref={boxesIconRef} size={20} />,
          label: "Users",
          href: "/admin/users",
          active: isItemActive("/admin/users", pathname.startsWith("/admin/users")),
          color: activeTabColor,
          iconRef: boxesIconRef
        },
        {
          icon: <ChallengeIcon ref={challengeIconRef} size={20} />,
          label: "Challenge",
          href: "/admin/ninety-day-challenge",
          active: isItemActive("/admin/ninety-day-challenge", pathname.startsWith("/admin/ninety-day-challenge")),
          color: activeTabColor,
          iconRef: challengeIconRef
        },
        {
          icon: <UserIcon ref={userIconRef} size={20} />,
          label: "Profile",
          href: "/profile",
          active: isItemActive("/profile", pathname === "/profile"),
          color: activeTabColor,
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
          color: activeTabColor,
          iconRef: dashboardIconRef
        },
        {
          icon: <ActivityIcon ref={activityIconRef} size={20} />,
          label: "Activity",
          href: "/activity",
          active: isItemActive("/activity", pathname === "/activity"),
          color: activeTabColor,
          iconRef: activityIconRef
        },
        {
          icon: <WorkoutIcon ref={workoutIconRef} size={20} />,
          label: "Workout",
          href: "/workout",
          active: isItemActive("/workout", pathname.startsWith("/workout")),
          color: activeTabColor,
          iconRef: workoutIconRef
        }
      ];

      baseItems.push({
        icon: <ChallengeIcon ref={challengeIconRef} size={20} />,
        label: "Challenge",
        href: "/ninety-day-challenge",
        active: isItemActive("/ninety-day-challenge", pathname.startsWith("/ninety-day-challenge")),
        color: activeTabColor,
        iconRef: challengeIconRef
      });

      baseItems.push({
        icon: <UserIcon ref={userIconRef} size={20} />,
        label: "Profile",
        href: "/profile",
        active: isItemActive("/profile", pathname === "/profile"),
        color: activeTabColor,
        iconRef: userIconRef
      });

      return baseItems;
    }
  };

  const navItems = getNavItems();

  if (isCheckingAdmin) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      <div className="
        bg-content1/95 backdrop-blur-lg
        shadow-xl shadow-black/10
        px-6 py-4
      ">
        <div className="flex items-center justify-between">
          {navItems.map((item) => (
            <AnimatedNavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={item.active}
              color={item.color}
              iconRef={item.iconRef}
              onItemClick={handleItemClick}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}