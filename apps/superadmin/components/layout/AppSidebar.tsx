"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Menu,
  Rocket,
  ChevronDown,
  Building2,
  Package,
  PlusCircle,
  LayoutList,
  Settings,
  ShieldEllipsis,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@repo/ui/components/ui";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@repo/ui/lib/utils";
import { useAuth } from "../../lib/context/AuthContext";

import { LucideIcon } from "lucide-react";

interface NavSubItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
  hasSubmenu?: boolean;
  subItems?: NavSubItem[];
}

interface NavGroup {
  category: string;
  icon: LucideIcon;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    category: "OVERVIEW",
    icon: LayoutDashboard,
    items: [{ title: "Platform Dashboard", url: "/dashboard", icon: Rocket }],
  },
  {
    category: "FLEET MANAGEMENT",
    icon: Building2,
    items: [
      { title: "Tenants Directory", url: "/tenants", icon: LayoutList },
      { title: "Onboard New", url: "/tenants/create", icon: PlusCircle },
      { title: "Subscription Packages", url: "/packages", icon: Package },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state, setOpen, isMobile, openMobile, setOpenMobile } = useSidebar();
  const { logout } = useAuth();
  const isCollapsed = state === "collapsed";
  const [hoveredGroup, setHoveredGroup] = React.useState<string | null>(null);

  const handleMiniSidebarClick = (group: NavGroup) => {
    const firstItem = group.items[0];
    if (!firstItem) return;
    let targetUrl = firstItem.url;
    const firstSubItem = firstItem.subItems?.[0];
    if (firstItem.hasSubmenu && firstSubItem) {
      targetUrl = firstSubItem.url;
    }
    router.push(targetUrl);
    setOpen(false);
  };

  const renderSidebarGroups = () => (
    <>
      {navigationGroups.map((group) => (
        <SidebarGroup key={group.category} className="mb-6 last:mb-0">
          <SidebarGroupLabel className="text-2xs font-bold text-slate-400 tracking-widest px-3 mb-2 uppercase">
            {group.category}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {group.items.map((item) => {
                const isActive = pathname.startsWith(item.url) || item.isActive;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        "flex items-center justify-between px-3 py-5 rounded-xl transition-all h-11 mb-1",
                        isActive
                          ? "bg-primary text-white hover:bg-primary shadow-md shadow-primary/20"
                          : "text-gray-600 hover:bg-gray-50",
                      )}
                    >
                      <Link
                        href={item.url}
                        className="flex items-center gap-3 w-full border-none"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <item.icon
                            className={cn(
                              "size-[18px]",
                              isActive ? "text-white" : "text-gray-400",
                            )}
                          />
                          <span className="font-semibold text-sm">
                            {item.title}
                          </span>
                        </div>
                        {item.hasSubmenu && (
                          <ChevronDown
                            className={cn(
                              "size-4 transition-transform",
                              isActive ? "text-white" : "text-gray-400",
                            )}
                          />
                        )}
                      </Link>
                    </SidebarMenuButton>

                    {item.hasSubmenu && !isCollapsed && !isMobile && (
                      <div className="ml-9 border-l border-gray-100 mt-1 mb-2 pl-3 space-y-1">
                        {item.subItems?.map((sub) => (
                          <Link
                            key={sub.title}
                            href={sub.url}
                            className="flex items-center gap-3 py-2 px-3 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-primary transition-colors font-medium border-none"
                          >
                            <sub.icon className="size-4" />
                            <span>{sub.title}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );

  return (
    <div
      className={cn(
        "flex h-full transition-all duration-300 ease-in-out bg-white border-r border-gray-100",
        isMobile ? "absolute top-0 left-0 z-[100] shadow-2xl" : "relative",
        isMobile && !openMobile
          ? "-translate-x-full opacity-0"
          : "translate-x-0 opacity-100",
      )}
      style={{
        width: isMobile ? (isCollapsed ? "70px" : "310px") : undefined,
      }}
    >
      {/* 1. MINI SIDEBAR */}
      <aside className="flex w-[70px] flex-col items-center bg-white border-r border-gray-100 py-6 flex-shrink-0 z-50">
        <button
          onClick={() => {
            if (isMobile) {
              setOpenMobile(!openMobile);
            } else {
              setOpen(!isCollapsed);
            }
          }}
          className="w-10 h-10 mb-8 rounded-lg flex items-center justify-center hover:bg-teal-50 text-gray-500 hover:text-primary transition-colors border-none"
        >
          <Menu className="size-5" />
        </button>

        <div className="flex flex-col gap-6">
          {navigationGroups.map((group) => {
            const isGroupActive = group.items.some((item) =>
              pathname.startsWith(item.url),
            );

            return (
              <Popover
                key={group.category}
                open={isCollapsed && hoveredGroup === group.category}
                onOpenChange={(open) => {
                  if (!open) setHoveredGroup(null);
                }}
              >
                <PopoverTrigger asChild>
                  <div
                    onMouseEnter={() =>
                      isCollapsed && setHoveredGroup(group.category)
                    }
                    onMouseLeave={() => setHoveredGroup(null)}
                  >
                    <button
                      onClick={() => handleMiniSidebarClick(group)}
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all group relative border-none",
                        isGroupActive
                          ? "bg-primary text-white shadow-lg shadow-primary/30"
                          : "text-gray-400 hover:bg-gray-50 hover:text-gray-600",
                      )}
                    >
                      <group.icon className="size-6" />
                    </button>
                  </div>
                </PopoverTrigger>

                <PopoverContent
                  side="right"
                  align="start"
                  sideOffset={20}
                  className="w-64 p-0 bg-white border-none shadow-[0_10px_40px_-10px_rgba(37,140,123,0.3)] rounded-3xl overflow-hidden animate-in fade-in slide-in-from-left-4 duration-300"
                  onMouseEnter={() => setHoveredGroup(group.category)}
                  onMouseLeave={() => setHoveredGroup(null)}
                >
                  <div className="p-6">
                    <div className="text-[10px] font-semibold text-primary tracking-widest mb-5 uppercase px-2">
                      {group.category}
                    </div>
                    <div className="flex flex-col gap-1">
                      {group.items.map((item) => (
                        <React.Fragment key={item.title}>
                          <Link
                            href={item.url}
                            className={cn(
                              "flex items-center gap-3 py-3 px-3 rounded-xl transition-all group/popitem border-none",
                              pathname.startsWith(item.url)
                                ? "bg-primary/5 text-primary"
                                : "text-gray-600 hover:bg-gray-50 hover:text-primary",
                            )}
                          >
                            <item.icon
                              className={cn(
                                "size-4",
                                pathname.startsWith(item.url)
                                  ? "text-primary"
                                  : "text-gray-400 group-hover/popitem:text-primary",
                              )}
                            />
                            <span className="font-semibold text-sm tracking-tight">
                              {item.title}
                            </span>
                          </Link>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}
        </div>

        <div className="mt-auto pb-4">
          <button
            className="w-12 h-12 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-all border-none"
            onClick={() => logout()}
          >
            <LogOut className="size-5" />
          </button>
        </div>
      </aside>

      {/* 2. MAIN SIDEBAR PANEL */}
      <Sidebar
        collapsible="none"
        className={cn(
          "bg-white h-full border-r border-gray-100 transition-all duration-300 ease-in-out overflow-hidden shadow-sm",
          isCollapsed
            ? "w-0 opacity-0 border-none px-0"
            : "w-[240px] opacity-100",
        )}
      >
        <SidebarHeader className="h-20 px-6 flex items-center gap-3 border-b border-gray-50 flex-row">
          <img
            src="/primary-logo.png"
            alt="Cantra Care"
            className="h-7 w-auto"
          />
          <span className="text-[9px] font-semibold text-primary tracking-[0.2em] uppercase">
            Control Panel
          </span>
        </SidebarHeader>

        <SidebarContent className="py-6 px-4 custom-scrollbar">
          {renderSidebarGroups()}
        </SidebarContent>
      </Sidebar>
    </div>
  );
}
