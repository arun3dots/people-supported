"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu, ChevronDown, ChevronRight } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  useSidebar,
  Button,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import { useAuth } from "../context/AuthContext";
import { ROLE_NAVIGATION, type NavGroup } from "./sidebar/roleNavigation";
import {
  isNavItemActive,
  isSubItemActive,
} from "./sidebar/navActiveMatcher";
import { CollapsedSidebarStrip } from "./sidebar/CollapsedSidebarStrip";

export function AppSidebar(): React.JSX.Element {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const {
    state,
    open,
    setOpen,
    isMobile,
    openMobile,
    setOpenMobile,
  } = useSidebar();
  const isCollapsed = state === "collapsed";

  const normalizedRole = user?.roleName?.toUpperCase() || "ADMIN";
  const activeGroups: NavGroup[] =
    ROLE_NAVIGATION[normalizedRole] ?? ROLE_NAVIGATION["ADMIN"] ?? [];
  const allItems = React.useMemo(
    () => activeGroups.flatMap((group) => group.items),
    [activeGroups],
  );

  const activeMenuTitle = React.useMemo(() => {
    const match = allItems.find(
      (item) =>
        item.hasSubmenu && isNavItemActive(item, pathname, searchParams),
    );
    return match?.title ?? null;
  }, [allItems, pathname, searchParams]);

  const [openMenuTitle, setOpenMenuTitle] = React.useState<string | null>(
    activeMenuTitle,
  );

  React.useEffect(() => {
    if (activeMenuTitle) {
      setOpenMenuTitle(activeMenuTitle);
    }
  }, [activeMenuTitle]);

  const toggleMenu = (title: string): void => {
    setOpenMenuTitle((prev) => (prev === title ? null : title));
  };

  const handleToggleSidebar = (): void => {
    if (isMobile) {
      setOpenMobile(!openMobile);
    } else {
      setOpen(!open);
    }
  };

  const renderNavItems = (): React.JSX.Element => (
    <div className="flex flex-col gap-2">
      {allItems.map((item) => {
        const isParentActive = isNavItemActive(item, pathname, searchParams);
        const isExpanded = openMenuTitle === item.title;

        if (item.hasSubmenu) {
          return (
            <div key={item.title}>
              <button
                type="button"
                onClick={() => toggleMenu(item.title)}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-3 py-3.5 rounded-[10px] transition-all duration-200 text-left cursor-pointer",
                  isParentActive && !isExpanded
                    ? "bg-[#4A706A] text-white"
                    : "text-[#141F1E] hover:bg-[#DEE9E6]/60",
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={cn(
                      "size-5 shrink-0",
                      isParentActive && !isExpanded
                        ? "text-white"
                        : "text-[#141F1E]",
                    )}
                    strokeWidth={1.5}
                  />
                  <span
                    className={cn(
                      "text-md leading-[18px] font-normal",
                      isParentActive && !isExpanded
                        ? "text-white"
                        : "text-[#141F1E]",
                    )}
                  >
                    {item.title}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="size-4 shrink-0 text-[#141F1E]" />
                ) : (
                  <ChevronRight
                    className={cn(
                      "size-4 shrink-0",
                      isParentActive && !isExpanded
                        ? "text-white"
                        : "text-[#141F1E]",
                    )}
                  />
                )}
              </button>

              {isExpanded && item.subItems && (
                <div className="flex flex-col gap-1 mt-1 mb-2 pl-3">
                  {item.subItems.map((sub) => {
                    const isSubActive = isSubItemActive(
                      sub,
                      item.subItems ?? [],
                      pathname,
                      searchParams,
                    );
                    return (
                      <Link
                        key={sub.title}
                        href={sub.url}
                        className={cn(
                          "pl-8 pr-3 py-3 rounded-[10px] text-md leading-[18px] font-normal transition-all duration-150",
                          isSubActive
                            ? "bg-[#4A706A] text-white"
                            : "text-[#141F1E] hover:bg-[#DEE9E6]/60",
                        )}
                      >
                        {sub.title}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        return (
          <Link
            key={item.title}
            href={item.url}
            className={cn(
              "flex items-center gap-3 px-3 py-3.5 rounded-[10px] transition-all duration-200",
              isParentActive
                ? "bg-[#4A706A] text-white"
                : "text-[#141F1E] hover:bg-[#DEE9E6]/60",
            )}
          >
            <item.icon
              className={cn(
                "size-5 shrink-0",
                isParentActive ? "text-white" : "text-[#141F1E]",
              )}
              strokeWidth={1.5}
            />
            <span
              className={cn(
                "text-md leading-[18px] font-normal",
                isParentActive ? "text-white" : "text-[#141F1E]",
              )}
            >
              {item.title}
            </span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div
      className={cn(
        "flex h-full transition-all duration-300 ease-in-out bg-[#F7F7F7] border-r border-[#E5E5E5] overflow-hidden",
        isMobile ? "absolute top-0 left-0 z-[100] shadow-2xl" : "relative",
        isMobile && !openMobile
          ? "-translate-x-full opacity-0"
          : "translate-x-0 opacity-100",
      )}
      style={{
        width: isCollapsed ? "70px" : "260px",
      }}
    >
      <CollapsedSidebarStrip
        isCollapsed={isCollapsed}
        allItems={allItems}
        pathname={pathname}
        searchParams={searchParams}
        onToggleSidebar={handleToggleSidebar}
      />

      <Sidebar
        collapsible="none"
        className={cn(
          "bg-[#F7F7F7] h-full transition-all duration-300 ease-in-out overflow-hidden shrink-0 flex flex-col",
          isCollapsed
            ? "w-0 opacity-0 border-none pointer-events-none"
            : "w-[260px] opacity-100",
        )}
      >
        <SidebarHeader className="h-16 px-4 flex flex-row items-center justify-between shrink-0 border-b border-[#E5E5E5]">
          <div className="flex items-center min-w-0">
            <img
              src="/primary-logo.png"
              alt="Cantra Care"
              className="h-auto w-auto object-contain"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleSidebar}
            className="size-8 hover:bg-[#DEE9E6] hover:text-[#4A706A] shrink-0"
          >
            <Menu className="size-5" />
          </Button>
        </SidebarHeader>

        <SidebarContent className="flex-1 py-4 px-3 custom-scrollbar overflow-y-auto">
          {renderNavItems()}
        </SidebarContent>
      </Sidebar>
    </div>
  );
}
