"use client";
import { useSidebarToggleContext } from "@/contexts/SidebarToggleContext";
import { IconBarbell, IconFlame } from "@tabler/icons-react";
import Link from "next/link";
import clsx from "clsx";

export default function SidebarBrand() {
  const { sidebarCollapse } = useSidebarToggleContext();

  return (
    <div
      className={clsx(
        "px-5 mb-6",
        sidebarCollapse ? "flex justify-center" : "",
      )}
    >
      <Link href="/" className="flex items-center gap-3">
        <div className="flex items-end justify-center w-11 h-[60px] pb-2 bg-primary rounded-b-lg">
          <IconFlame size={28} className="text-black" />
        </div>
        {!sidebarCollapse && (
          <div className="flex flex-col justify-center pt-[18px]">
            <p className="text-2xl font-bold leading-tight" style={{ color: '#a6ff00' }}>C7</p>
            <p className="text-xs text-foreground-500 leading-tight">Personal Fitness Studio</p>
          </div>
        )}
      </Link>
    </div>
  );
}
