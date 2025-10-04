"use client";
import { useSidebarToggleContext } from "@/contexts/SidebarToggleContext";
import clsx from "clsx";
import { useEffect } from "react";

export default function SidebarWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapse, mobileMenuOpen, toggleMobileMenu } = useSidebarToggleContext();

  console.log('SidebarWrapper - mobileMenuOpen:', mobileMenuOpen);
  console.log('SidebarWrapper - toggleMobileMenu function:', toggleMobileMenu);

  // Close mobile menu when clicking outside or pressing escape
  // Also handle body scroll lock
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        toggleMobileMenu();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (mobileMenuOpen && !target.closest('.mobile-sidebar') && !target.closest('.hamburger-button')) {
        toggleMobileMenu();
      }
    };

    if (mobileMenuOpen) {
      // Lock body scroll on mobile when sidebar is open
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('click', handleClickOutside);
    } else {
      // Restore body scroll
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [mobileMenuOpen, toggleMobileMenu]);

  // Desktop sidebar - responsive width based on collapse state
  const desktopSidebarClass = clsx({
    "fixed top-0 left-0 h-full bg-white dark:bg-zinc-900 hidden md:block shadow-md overflow-x-hidden overflow-y-auto transition-all duration-300 ease-in-out z-30":
      true,
    "w-20": sidebarCollapse,
    "w-64": !sidebarCollapse,
  });

  // Mobile sidebar
  const mobileSidebarClass = clsx({
    "mobile-sidebar fixed top-0 left-0 h-full bg-white dark:bg-zinc-900 md:hidden shadow-lg overflow-x-hidden overflow-y-auto transition-transform duration-300 ease-in-out z-[9999] w-64":
      true,
    "transform translate-x-0": mobileMenuOpen,
    "transform -translate-x-full": !mobileMenuOpen,
  });

  return (
    <>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-[9998] transition-opacity duration-300 ease-in-out" />
      )}

      {/* Desktop Sidebar */}
      <aside className={desktopSidebarClass}>{children}</aside>

      {/* Mobile Sidebar */}
      <aside className={mobileSidebarClass}>{children}</aside>
    </>
  );
}
