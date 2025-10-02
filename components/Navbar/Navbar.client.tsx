"use client";
import { usePathname } from "next/navigation";
// import { Navbar, NavbarContent, NavbarItem } from "@nextui-org/navbar";
import Link from "next/link";
import {
  IconDashboard,
  IconJumpRope,
  IconBook,
  IconActivity,
  IconFlame,
  IconMenu2,
  IconX,
} from "@tabler/icons-react";
import NavbarUser from "./NavbarUser";
import { useSidebarToggleContext } from "@/contexts/SidebarToggleContext";

const NAV_CONTENT_ITEMS = [
  { icon: <IconDashboard />, href: "/dashboard", label: "Dashboard" },
  { icon: <IconActivity />, href: "/activity", label: "Activity Log"},
  { icon: <IconJumpRope />, href: "/workout", label: "Start Workout"},
  { icon: <IconBook />, href: "/exercises", label: "Exercises"},
];

export default function MobileNavbarClient({
  username,
  userImage,
}: {
  username: string | undefined;
  userImage: string | undefined;
}) {
  const pathname = usePathname();
  const { toggleMobileMenu, mobileMenuOpen } = useSidebarToggleContext();

  const handleMenuToggle = () => {
    console.log('Hamburger clicked, current state:', mobileMenuOpen);
    console.log('toggleMobileMenu function:', toggleMobileMenu);
    toggleMobileMenu();
    console.log('After toggle - should be:', !mobileMenuOpen);
  };

  return (
    <nav className="bg-white dark:bg-zinc-900 block md:hidden shadow-md z-[9997] relative flex items-center justify-between px-4 py-2">
      <div className="flex items-center gap-3">
        <button
          className="hamburger-button transition-transform duration-200 ease-in-out relative z-[10000] p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          onClick={handleMenuToggle}
          aria-label="Toggle menu"
        >
          <div className={`transition-transform duration-200 ease-in-out ${mobileMenuOpen ? 'rotate-90' : 'rotate-0'}`}>
            {mobileMenuOpen ? <IconX size={24} /> : <IconMenu2 size={24} />}
          </div>
        </button>
        <Link href="/" className="text-lg font-semibold tracking-tight" aria-label="Home Page">
          <IconFlame className="text-primary" />
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {NAV_CONTENT_ITEMS.slice(0, 3).map((item) => (
          <Link key={item.href} href={item.href} aria-label={item.label} className="p-2">
            {item.icon}
          </Link>
        ))}
      </div>

      <div className="flex items-center">
        <Link href="/profile">
          <NavbarUser username={username} userImage={userImage} />
        </Link>
      </div>
    </nav>
  );
}
