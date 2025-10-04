import { currentUser } from "@clerk/nextjs";
import SidebarNav from "./SidebarNav";
import SidebarBrand from "./SidebarBrand";
import { ThemeSwitcher } from "@/components/ThemeSwitcher/ThemeSwitcher";
//import SidebarWorkoutControls from "./SidebarWorkoutControls";
import SidebarUser from "./SidebarUser";
//import SidebarSearch from "./SidebarSearch";
//import SidebarSocials from "./SidebarSocials";
import SidebarWrapper from "./SidebarWrapper.client";

export default async function Sidebar() {
  const user = await currentUser();

  if (!user) {
    throw new Error("You must be signed in to view this page.");
  }

  const username = user?.username || undefined;
  const userImage = user?.imageUrl;

  return (
    <SidebarWrapper>
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0">
          <SidebarBrand />
          <SidebarUser username={username} userImage={userImage} />
          {/* <SidebarSearch /> */}
        </div>
        <div className="flex-1 overflow-y-auto pb-20">
          <SidebarNav />
          {/* <SidebarWorkoutControls /> */}
        </div>
        <div className="absolute bottom-0 left-0 right-0 py-5 px-5 flex flex-col items-center bg-white dark:bg-zinc-900">
          <ThemeSwitcher />
          {/* <SidebarSocials /> */}
        </div>
      </div>
    </SidebarWrapper>
  );
}
