import Sidebar from "@/components/Sidebar/Sidebar";
import Navbar from "@/components/Navbar/Navbar";
import MobileHeader from "@/components/Navigation/MobileHeader";
import AnimatedBottomNav from "@/components/Navigation/AnimatedBottomNav";
import ActiveWorkoutWarning from "@/components/Notices/ActiveWorkoutWarning";
import LayoutWrapper from "./LayoutWrapper.client";
import SiteNotice from "./SiteNotice";
import ResponsiveLayoutWrapper from "./ResponsiveLayoutWrapper.client";
import PageLoadingSpinner from "@/components/UI/PageLoadingSpinner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteNotice
        message="Beta: Data may be subject to change or loss."
        variant="danger"
        visible={false}
      />
      {/* Page Loading Indicator */}
      <PageLoadingSpinner />
      <div className="flex grow relative">
        <Sidebar />
        <main className="flex flex-col grow w-full min-w-0">
          {/* Mobile Header - Shows only on mobile */}
          <MobileHeader />
          {/* Original Navbar - Keep for backward compatibility */}
          <div className="hidden">
            <Navbar />
          </div>
          <ResponsiveLayoutWrapper>
            <LayoutWrapper>
              <ActiveWorkoutWarning />
              {/* Add bottom padding on mobile for bottom nav */}
              <div className="pb-20 md:pb-0">
                {children}
              </div>
            </LayoutWrapper>
          </ResponsiveLayoutWrapper>
        </main>
        {/* Animated Bottom Navigation - Shows only on mobile */}
        <AnimatedBottomNav />
      </div>
    </>
  );
}
