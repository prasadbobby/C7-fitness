import Sidebar from "@/components/Sidebar/Sidebar";
import Navbar from "@/components/Navbar/Navbar";
import ActiveWorkoutWarning from "@/components/Notices/ActiveWorkoutWarning";
import LayoutWrapper from "./LayoutWrapper.client";
import SiteNotice from "./SiteNotice";
import ResponsiveLayoutWrapper from "./ResponsiveLayoutWrapper.client";

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
      <div className="flex grow relative">
        <Sidebar />
        <main className="flex flex-col grow w-full min-w-0">
          <Navbar />
          <ResponsiveLayoutWrapper>
            <LayoutWrapper>
              <ActiveWorkoutWarning />
              {children}
            </LayoutWrapper>
          </ResponsiveLayoutWrapper>
        </main>
      </div>
    </>
  );
}
