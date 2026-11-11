"use client";

import { Menu } from "lucide-react";
import { useSidebar, Button } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";

import { useAuth } from "../context/AuthContext";
import { HeaderSearch } from "./HeaderSearch";
import { UserMenu } from "./UserMenu";
import { BranchSwitcher } from "./BranchSwitcher";
import { NotificationDropdown } from "./NotificationDropdown";
import { PushSubscriptionManager } from "./PushSubscriptionManager";

export function PageHeader() {
  const { state, open, setOpen, openMobile, setOpenMobile, isMobile } = useSidebar();
  const { user } = useAuth();

  return (
    <div className={cn("w-full pt-4 pb-2 px-4 sm:px-8 lg:px-12", state === "collapsed" && "sm:px-6 lg:px-6")}>
      <PushSubscriptionManager />
      <header className="w-full mx-auto h-[97px] bg-[#F7F7F7] px-[20px] flex items-center justify-between rounded-[20px] font-['Outfit'] shadow-none">

        {/* Frame 24: Left Container (Title & Search) */}
        <div className="flex items-center gap-[16px] sm:gap-[42px] flex-1 max-w-[710px]">
          {/* Mobile Sidebar Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (isMobile && !openMobile) {
                setOpenMobile(true);
              } else {
                setOpen(!open);
              }
            }}
            className="md:hidden shrink-0"
          >
            <Menu className="size-6 text-black" />
          </Button>



          {/* Search Box Component */}
          <div className="hidden md:block w-full max-w-[621px]">
            <HeaderSearch />
          </div>
        </div>

        {/* Frame 22: Right Container (Notifications & User Profile) */}
        <div className="flex items-center gap-[20px] sm:gap-[30px] shrink-0 ml-[20px] lg:ml-[74px]">
          <BranchSwitcher />
          <NotificationDropdown />
          <UserMenu />
        </div>

      </header>
    </div>
  );
}