"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconDashboard,
  IconUsers,
  IconBarbell,
  IconChartBar,
  IconSettings,
  IconChevronLeft,
  IconMenu2,
  IconHome
} from "@tabler/icons-react";
import { Button } from "@nextui-org/react";

const adminMenuItems = [
  {
    name: "Admin Dashboard",
    href: "/admin",
    icon: IconDashboard,
  },
  {
    name: "User Management",
    href: "/admin/users",
    icon: IconUsers,
  },
  {
    name: "Workout Assignment",
    href: "/admin/workouts",
    icon: IconBarbell,
  },
  {
    name: "User Analytics",
    href: "/admin/analytics",
    icon: IconChartBar,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: IconSettings,
  },
];

export default function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className={`${
      isCollapsed ? "w-16" : "w-64"
    } transition-all duration-300 bg-content1 border-r border-divider h-screen flex flex-col`}>

      {/* Header */}
      <div className="p-4 border-b border-divider flex items-center justify-between">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
        )}
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <IconMenu2 size={20} /> : <IconChevronLeft size={20} />}
        </Button>
      </div>

      {/* Back to App */}
      <div className="p-4 border-b border-divider">
        <Link href="/dashboard">
          <Button
            variant="ghost"
            className={`w-full ${isCollapsed ? "px-0" : "justify-start"}`}
            startContent={!isCollapsed ? <IconHome size={20} /> : undefined}
          >
            {isCollapsed ? <IconHome size={20} /> : "Back to App"}
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {adminMenuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <Button
                    variant={isActive ? "flat" : "ghost"}
                    className={`w-full ${isCollapsed ? "px-0" : "justify-start"} ${
                      isActive ? "bg-primary/10 text-primary" : ""
                    }`}
                    startContent={!isCollapsed ? <Icon size={20} /> : undefined}
                  >
                    {isCollapsed ? <Icon size={20} /> : item.name}
                  </Button>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}