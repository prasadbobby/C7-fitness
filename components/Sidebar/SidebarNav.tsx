"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { useSidebarToggleContext } from "@/contexts/SidebarToggleContext";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";

interface NavItemProps {
  icon: JSX.Element;
  label?: string;
  href?: string;
  active: boolean;
}

import {
  IconDashboard,
  IconJumpRope,
  IconActivity,
  IconUser,
  IconBook,
  IconHelp,
  IconLayoutSidebarLeftExpand,
  IconLayoutSidebarLeftCollapse,
  IconClipboardList,
  IconShield,
  IconUsers,
  IconBarbell,
  IconChartBar,
  IconSettings,
  IconTrendingUp,
  IconX,
  IconCalendarEvent,
  IconWorldStar,
} from "@tabler/icons-react";

export default function SidebarNav() {
  const { sidebarCollapse, toggleSidebar, mobileMenuOpen, toggleMobileMenu } = useSidebarToggleContext();
  const pathname = usePathname();
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChallengeEnabled, setIsChallengeEnabled] = useState(false);

  useEffect(() => {
    async function checkUserStatus() {
      if (user) {
        try {
          // Check admin status
          const adminResponse = await fetch('/api/admin/check-auth');
          const adminData = await adminResponse.json();
          setIsAdmin(adminData.isAdmin);

          // Check if user is enabled for 90-day challenge
          const challengeResponse = await fetch('/api/ninety-day-challenge/check-access');
          if (challengeResponse.ok) {
            const challengeData = await challengeResponse.json();
            setIsChallengeEnabled(challengeData.isEnabled);
          }
        } catch (error) {
          console.error('Error checking user status:', error);
          setIsAdmin(false);
          setIsChallengeEnabled(false);
        }
      }
    }
    checkUserStatus();
  }, [user]);

  return (
    <div className="px-5">
      <ul className="text-sm">
        {isAdmin ? (
          <>
            {/* Admin Section - First Priority */}
            <SubMenuTitle title="Admin" />

            <NavItem
              icon={<IconShield size={22} className="shrink-0" />}
              label="Admin Dashboard"
              href="/admin"
              active={pathname === "/admin"}
            />

            <NavItem
              icon={<IconUsers size={22} className="shrink-0" />}
              label="User Management"
              href="/admin/users"
              active={pathname === "/admin/users"}
            />

            <NavItem
              icon={<IconBarbell size={22} className="shrink-0" />}
              label="Workout Assignment"
              href="/admin/workouts"
              active={pathname === "/admin/workouts"}
            />

            <NavItem
              icon={<IconTrendingUp size={22} className="shrink-0" />}
              label="Step Tracking"
              href="/admin/step-tracking"
              active={pathname === "/admin/step-tracking"}
            />

            <NavItem
              icon={<IconChartBar size={22} className="shrink-0" />}
              label="Analytics"
              href="/admin/analytics"
              active={pathname === "/admin/analytics"}
            />

            <NavItem
              icon={<IconCalendarEvent size={22} className="shrink-0" />}
              label="90-Day Challenge"
              href="/admin/ninety-day-challenge"
              active={pathname === "/admin/ninety-day-challenge"}
            />


            {/* Workout Section for Admin */}
            <SubMenuTitle title="Workout" />

            <NavItem
              icon={<IconJumpRope size={22} className="shrink-0" />}
              label="Start Workout"
              href="/workout"
              active={pathname.startsWith("/workout")}
            />

            <NavItem
              icon={<IconClipboardList size={22} className="shrink-0" />}
              label="Routine Creator"
              href="/edit-routine/step-1"
              active={pathname.startsWith("/edit-routine/")}
            />

            <NavItem
              icon={<IconBook size={22} className="shrink-0" />}
              label="Browse Exercises"
              href="/exercises"
              active={pathname === "/exercises"}
            />

            {/* Data Section for Admin */}
            <SubMenuTitle title="Data" />

            <NavItem
              icon={<IconUser size={22} className="shrink-0" />}
              label="Profile"
              href="/profile"
              active={pathname === "/profile"}
            />

            <NavItem
              icon={<IconSettings size={22} className="shrink-0" />}
              label="Settings"
              href="/admin/settings"
              active={pathname === "/admin/settings"}
            />
          </>
        ) : (
          <>
            {/* Normal User Section - Keep as before */}
            <SubMenuTitle title="Data" />

            <NavItem
              icon={<IconDashboard size={22} className="shrink-0" />}
              label="Dashboard"
              href="/dashboard"
              active={pathname === "/dashboard"}
            />

            <NavItem
              icon={<IconActivity size={22} className="shrink-0" />}
              label="Activity Log"
              href="/activity"
              active={pathname === "/activity"}
            />

            <NavItem
              icon={<IconTrendingUp size={22} className="shrink-0" />}
              label="Step Tracking"
              href="/step-tracking"
              active={pathname === "/step-tracking"}
            />

            {isChallengeEnabled && (
              <>
                <NavItem
                  icon={<IconCalendarEvent size={22} className="shrink-0" />}
                  label="90-Day Challenge"
                  href="/ninety-day-challenge"
                  active={pathname === "/ninety-day-challenge"}
                />
              </>
            )}

            <NavItem
              icon={<IconUser size={22} className="shrink-0" />}
              label="Profile"
              href="/profile"
              active={pathname === "/profile"}
            />

            <SubMenuTitle title="Workout" />

            <NavItem
              icon={<IconJumpRope size={22} className="shrink-0" />}
              label="Start Workout"
              href="/workout"
              active={pathname.startsWith("/workout")}
            />

            <NavItem
              icon={<IconBook size={22} className="shrink-0" />}
              label="Browse Exercises"
              href="/exercises"
              active={pathname === "/exercises"}
            />

            <SubMenuTitle title="More" />

            <NavItem
              icon={<IconHelp size={22} className="shrink-0" />}
              label="Support"
              href="/support"
              active={pathname === "/support"}
            />
          </>
        )}

        <SidebarToggle />

      </ul>
    </div>
  );
}


function SubMenuTitle({ title }: { title: string }) {
  const { sidebarCollapse } = useSidebarToggleContext();

  return (
    !sidebarCollapse && (
      <li className="uppercase text-xs text-zinc-600 dark:text-zinc-400 font-semibold mb-1 mt-4 px-2">
        {title}
      </li>
    )
  );
}


function NavItem({ icon, label, href, active }: NavItemProps) {
  const { sidebarCollapse, toggleMobileMenu } = useSidebarToggleContext();

  const handleClick = () => {
    // Close mobile menu when navigation item is clicked
    if (window.innerWidth < 768) { // md breakpoint
      toggleMobileMenu();
    }
  };

  const content = (
    <div
      className={clsx(
        "flex items-center space-x-3 p-2 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-800 transition-colors duration-200 ease-in-out",
        sidebarCollapse ? "justify-center" : "",
        active
          ? "bg-zinc-300 dark:bg-zinc-800 text-black dark:text-primary"
          : "text-zinc-600 dark:text-zinc-400",
      )}
    >
      {icon}
      {!sidebarCollapse && label && <div>{label}</div>}
    </div>
  );

  return (
    <li className="my-1">
      <Link href={href || "#"} onClick={handleClick}>{content}</Link>
    </li>
  );
}


function SidebarToggle() {
  const { sidebarCollapse, toggleSidebar } = useSidebarToggleContext();

  return (
    <li onClick={toggleSidebar} className="cursor-pointer my-1">
      <div
        className={clsx(
          "flex items-center space-x-3 p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-800 transition-colors duration-200 ease-in-out",
          sidebarCollapse ? "justify-center" : "",
        )}
      >
        {sidebarCollapse ? (
          <IconLayoutSidebarLeftExpand size={22} className="shrink-0" />
        ) : (
          <IconLayoutSidebarLeftCollapse size={22} className="shrink-0" />
        )}
        {!sidebarCollapse && <div>Collapse Sidebar</div>}
      </div>
    </li>
  );
}