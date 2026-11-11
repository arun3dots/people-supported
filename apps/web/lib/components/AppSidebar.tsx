"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  Menu,
  ChevronDown,
  ChevronRight,
  Building2,
  Package,
  ClipboardList,
  CreditCard,
  FileText,
  UserCircle,
  ShieldAlert,
  UserPlus,
  Heart,
  AlertTriangle,
  ClipboardCheck,
  ListTodo,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  useSidebar,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@repo/ui/components/ui";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@repo/ui/lib/utils";

import { LucideIcon } from "lucide-react";

// Navigation Data interfaces
interface NavSubItem {
  title: string;
  url: string;
}

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  hasSubmenu?: boolean;
  subItems?: NavSubItem[];
}

interface NavGroup {
  category: string;
  icon: LucideIcon;
  items: NavItem[];
}


import { useAuth } from "../context/AuthContext";

export function AppSidebar() {
  const pathname = usePathname();
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

  const roleNavigation: Record<string, NavGroup[]> = {
    ADMIN: [
      {
        category: "OVERVIEW",
        icon: LayoutDashboard,
        items: [{ title: "Overview", url: "/admin/dashboard", icon: LayoutDashboard }],
      },
      {
        category: "ENQUIRIES",
        icon: UserPlus,
        items: [
          {
            title: "Enquiry Directory",
            url: "/admin/enquiries",
            icon: UserPlus,
          },
        ],
      },
      {
        category: "PEOPLE SUPPORTED",
        icon: Heart,
        items: [
          {
            title: "People Supported",
            url: "/admin/residents",
            icon: Heart,
            hasSubmenu: true,
            subItems: [
              { title: "People Supported Directory", url: "/admin/residents" },
              { title: "Daily Tasks Board", url: "/admin/care-plans/daily-tasks" },
              { title: "Clinical Escalations & CQC", url: "/admin/escalations" },
            ],
          },
        ],
      },
      {
        category: "PROPERTIES & SCHEMES",
        icon: Building2,
        items: [
          {
            title: "Properties & Schemes",
            url: "/admin/configuration/facility",
            icon: Building2,
            hasSubmenu: true,
            subItems: [
              { title: "Properties Directory", url: "/admin/configuration/facility?tab=properties" },
              { title: "Supported Living Schemes", url: "/admin/configuration/facility?tab=schemes" },
              { title: "Room Management", url: "/admin/configuration/facility?tab=rooms" },
              { title: "Bed Management", url: "/admin/configuration/facility?tab=beds" },
            ],
          },
        ],
      },
      {
        category: "STAFF",
        icon: Users,
        items: [
          { title: "Staff Directory", url: "/admin/staff", icon: Users },
        ],
      },
      {
        category: "ROTA MANAGEMENT",
        icon: Calendar,
        items: [
          {
            title: "Rota Management",
            url: "/admin/staff/rota",
            icon: Calendar,
            hasSubmenu: true,
              subItems: [
                { title: "Shift Planner", url: "/admin/staff/rota" },
                { title: "Hours Summary", url: "/admin/staff/rota?tab=hours" },
                { title: "Staff Allocation", url: "/admin/staff/rota?tab=allocation" },
                { title: "Leave Request Management", url: "/admin/staff/requests" },
                { title: "Attendance", url: "/admin/staff/rota?tab=attendance" },
              ],
          },
        ],
      },
      {
        category: "INCIDENT MANAGEMENT",
        icon: ShieldAlert,
        items: [
          {
            title: "Incident Management",
            url: "/admin/incidents",
            icon: ShieldAlert,
          },
        ],
      },
      {
        category: "FINANCE",
        icon: CreditCard,
        items: [
          {
            title: "Finance",
            url: "/admin/finance/invoices",
            icon: CreditCard,
            hasSubmenu: true,
            subItems: [
              { title: "New Invoice", url: "/admin/finance/new-invoice" },
              { title: "Invoice Management", url: "/admin/finance/invoices" },
              { title: "Payment History", url: "/admin/finance/payments" },
              { title: "Expense Management", url: "/admin/finance/expenses" },
            ],
          },
        ],
      },
      {
        category: "REPORTS & AUDIT",
        icon: FileText,
        items: [
          {
            title: "Compliance",
            url: "#",
            icon: Package,
            hasSubmenu: true,
            subItems: [
              { title: "Audit Log", url: "/admin/audit-log" },
              { title: "Reports", url: "/admin/reports" },
            ],
          },
          {
            title: "Resources",
            url: "/admin/configuration/risk-templates",
            icon: ShieldAlert,
            hasSubmenu: true,
            subItems: [
              { title: "Risk Templates", url: "/admin/configuration/risk-templates" },
              { title: "Assessment Templates", url: "/admin/enquiries/templates" },
            ],
          },
        ],
      },
      {
        category: "SETTINGS",
        icon: Settings,
        items: [
          {
            title: "Settings",
            url: "#",
            icon: Settings,
            hasSubmenu: true,
            subItems: [
              { title: "Profile", url: "/profile" },
              { title: "Organisation Profile", url: "/admin/settings/organization" },
              // { title: "Security", url: "/admin/settings/security" },
              // { title: "User Management", url: "/admin/settings/users" },
              { title: "Roles & Permissions", url: "/admin/settings/roles" },
              { title: "Subscription Management", url: "/subscriptions" },
            ],
          },
        ],
      },
    ],
    SUPERADMIN: [
      {
        category: "PLATFORM",
        icon: LayoutDashboard,
        items: [{ title: "Overview", url: "/admin/dashboard", icon: LayoutDashboard }],
      },
      {
        category: "TENANTS",
        icon: Building2,
        items: [
          { title: "Tenant List", url: "/admin/tenants", icon: Building2 },
        ],
      },
      {
        category: "BILLING & PLANS",
        icon: Package,
        items: [
          {
            title: "Finance",
            url: "#",
            icon: CreditCard,
            hasSubmenu: true,
            subItems: [
              { title: "Packages", url: "/packages" },
              { title: "Subscriptions", url: "/subscriptions" },
            ],
          },
        ],
      },
      {
        category: "REPORTS & AUDIT",
        icon: FileText,
        items: [
          {
            title: "Resources",
            url: "#",
            icon: Package,
            hasSubmenu: true,
            subItems: [
              { title: "Audit Log", url: "/admin/audit-log" },
              { title: "Reports", url: "/admin/reports" },
            ],
          },
        ],
      },
    ],
    CARER: [
      {
        category: "OVERVIEW",
        icon: LayoutDashboard,
        items: [
          { title: "Overview", url: "/carer/dashboard", icon: LayoutDashboard },
          { title: "My Rota", url: "/carer/rota", icon: Calendar },
          { title: "People Supported", url: "/carer/residents", icon: Heart },
          { title: "Report Incident", url: "/carer/incidents", icon: AlertTriangle },
          { title: "Handover", url: "/carer/handover", icon: ClipboardCheck },
          { title: "Task List", url: "/carer/tasks", icon: ListTodo },
        ],
      },
      {
        category: "ROTA & LEAVE",
        icon: Calendar,
        items: [
          { title: "Leave Management", url: "/carer/requests", icon: ClipboardList },
        ],
      },
      {
        category: "USER",
        icon: UserCircle,
        items: [{ title: "My Profile", url: "/profile", icon: UserCircle }],
      },
    ],
    NURSE: [
      {
        category: "OVERVIEW",
        icon: LayoutDashboard,
        items: [
          { title: "Overview", url: "/nurse/dashboard", icon: LayoutDashboard },
          { title: "My Rota", url: "/nurse/rota", icon: Calendar },
        ],
      },
      {
        category: "ROTA & LEAVE",
        icon: Calendar,
        items: [
          { title: "Leave Management", url: "/nurse/requests", icon: ClipboardList },
        ],
      },
      {
        category: "USER",
        icon: UserCircle,
        items: [{ title: "My Profile", url: "/profile", icon: UserCircle }],
      },
    ],
    RESIDENT: [
      {
        category: "OVERVIEW",
        icon: LayoutDashboard,
        items: [
          { title: "Overview", url: "/resident/dashboard", icon: LayoutDashboard },
        ],
      },
      {
        category: "USER",
        icon: UserCircle,
        items: [{ title: "Profile", url: "/profile", icon: UserCircle }],
      },
    ],
  };

  const normalizedRole = user?.roleName?.toUpperCase() || "ADMIN";
  const activeGroups: NavGroup[] =
    roleNavigation[normalizedRole] ?? roleNavigation["ADMIN"] ?? [];

  // Flatten all items for rendering as a single flat list
  const allItems = activeGroups.flatMap((group) => group.items);

  // Track which item with a submenu is expanded — only 1 menu expanded at a time (accordion style)
  const getInitialOpenMenu = () => {
    let activeTitle: string | null = null;
    allItems.forEach((item) => {
      if (item.hasSubmenu) {
        const isActive =
          pathname === item.url ||
          item.subItems?.some((sub) => pathname === sub.url);
        if (isActive) {
          activeTitle = item.title;
        }
      }
    });
    return activeTitle;
  };

  const [openMenuTitle, setOpenMenuTitle] = React.useState<string | null>(
    getInitialOpenMenu
  );

  const [hoveredGroup, setHoveredGroup] = React.useState<string | null>(null);

  const toggleMenu = (title: string) => {
    setOpenMenuTitle((prev) => (prev === title ? null : title));
  };

  const renderNavItems = () => (
    <div className="flex flex-col gap-2">
      {allItems.map((item) => {
        const isParentActive =
          pathname === item.url ||
          item.subItems?.some((sub) => pathname === sub.url);
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
                    : "text-[#141F1E] hover:bg-[#DEE9E6]/60"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={cn(
                      "size-5 shrink-0",
                      isParentActive && !isExpanded ? "text-white" : "text-[#141F1E]"
                    )}
                    strokeWidth={1.5}
                  />
                  <span
                    className={cn(
                      "text-md leading-[18px] font-normal",
                      isParentActive && !isExpanded ? "text-white" : "text-[#141F1E]"
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
                      isParentActive && !isExpanded ? "text-white" : "text-[#141F1E]"
                    )}
                  />
                )}
              </button>

              {isExpanded && item.subItems && (
                <div className="flex flex-col gap-1 mt-1 mb-2 pl-3">
                  {item.subItems.map((sub) => {
                    const isSubActive =
                      pathname === sub.url ||
                      pathname.startsWith((sub.url.split("?")[0] ?? "") + "/");
                    return (
                      <Link
                        key={sub.title}
                        href={sub.url}
                        className={cn(
                          "pl-8 pr-3 py-3 rounded-[10px] text-md leading-[18px] font-normal transition-all duration-150",
                          isSubActive
                            ? "bg-[#4A706A] text-white"
                            : "text-[#141F1E] hover:bg-[#DEE9E6]/60"
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
                : "text-[#141F1E] hover:bg-[#DEE9E6]/60"
            )}
          >
            <item.icon
              className={cn(
                "size-5 shrink-0",
                isParentActive ? "text-white" : "text-[#141F1E]"
              )}
              strokeWidth={1.5}
            />
            <span
              className={cn(
                "text-md leading-[18px] font-normal",
                isParentActive ? "text-white" : "text-[#141F1E]"
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
      {/* MINI SIDEBAR — 70px icon-only strip when collapsed */}
      <aside
        className={cn(
          "flex flex-col items-center bg-[#F7F7F7] border-r border-[#E5E5E5] py-4 flex-shrink-0 z-50 transition-all duration-300 ease-in-out overflow-hidden h-full",
          isCollapsed
            ? "w-[70px] opacity-100"
            : "w-0 opacity-0 p-0 border-none pointer-events-none",
        )}
      >
        {/* Toggle button */}
        <div className="h-16 flex items-center justify-center shrink-0 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (isMobile) {
                setOpenMobile(!openMobile);
              } else {
                setOpen(!open);
              }
            }}
            className="size-9 hover:bg-[#DEE9E6] hover:text-[#4A706A] shrink-0"
          >
            <Menu className="size-5" />
          </Button>
        </div>

        {/* Icon-only nav items — one icon per module, with popover flyout */}
        <div className="flex flex-col gap-3 px-2 overflow-y-auto w-full items-center">
          {allItems.map((item) => {
            const isItemActive =
              pathname === item.url ||
              item.subItems?.some((sub) => pathname === sub.url);
            const itemKey = item.title;
            const ItemIcon = item.icon;

            if (!item.hasSubmenu) {
              return (
                <Link
                  key={itemKey}
                  href={item.url === "#" ? "#" : item.url}
                  className={cn(
                    "w-11 h-11 rounded-[10px] flex items-center justify-center transition-all duration-200 cursor-pointer",
                    isItemActive
                      ? "bg-[#4A706A] text-white"
                      : "text-[#141F1E] hover:bg-[#DEE9E6]/60"
                  )}
                  title={item.title}
                >
                  <ItemIcon className="size-5" strokeWidth={1.5} />
                </Link>
              );
            }

            const isGroupActive =
              pathname === item.url ||
              item.subItems?.some((sub) => pathname === sub.url) ||
              false;

            return (
              <Popover
                key={itemKey}
                open={isCollapsed && hoveredGroup === itemKey}
                onOpenChange={(isOpen) => {
                  if (!isOpen) setHoveredGroup(null);
                }}
              >
                <PopoverTrigger asChild>
                  <div
                    onMouseEnter={() =>
                      isCollapsed && setHoveredGroup(itemKey)
                    }
                    onMouseLeave={() => setHoveredGroup(null)}
                  >
                    <button
                      type="button"
                      title={item.title}
                      className={cn(
                        "w-11 h-11 rounded-[10px] flex items-center justify-center transition-all duration-200 cursor-pointer",
                        isGroupActive
                          ? "bg-[#4A706A] text-white"
                          : "text-[#141F1E] hover:bg-[#DEE9E6]/60"
                      )}
                    >
                      <ItemIcon className="size-5" strokeWidth={1.5} />
                    </button>
                  </div>
                </PopoverTrigger>

                <PopoverContent
                  side="right"
                  align="start"
                  sideOffset={12}
                  className="w-56 p-3 bg-white border border-[#E5E5E5] shadow-lg rounded-[16px] overflow-hidden"
                  onMouseEnter={() => setHoveredGroup(itemKey)}
                  onMouseLeave={() => setHoveredGroup(null)}
                >
                  <div className="text-md font-semibold text-[#4A706A] tracking-[0.15em] uppercase mb-2 px-2">
                    {item.title}
                  </div>
                  <div className="flex flex-col gap-1">
                    <React.Fragment key={item.title}>
                        <Link
                          href={item.url === "#" ? "#" : item.url}
                          className={cn(
                            "flex items-center gap-2.5 py-2.5 px-2 rounded-[8px] transition-all",
                            pathname === item.url ||
                              item.subItems?.some((s) => pathname === s.url)
                              ? "bg-[#4A706A] text-white"
                              : "text-[#141F1E] hover:bg-[#DEE9E6]/60"
                          )}
                        >
                          <item.icon className="size-4 shrink-0" strokeWidth={1.5} />
                          <span className="text-[13px] leading-[17px] font-normal">
                            {item.title}
                          </span>
                        </Link>
                        {item.hasSubmenu && item.subItems && (
                          <div className="flex flex-col gap-0.5 pl-2 ml-2 border-l border-[#E5E5E5] mb-1">
                            {item.subItems.map((sub) => (
                              <Link
                                key={sub.title}
                                href={sub.url}
                                className={cn(
                                  "py-2 px-2 rounded-[8px] text-md leading-[16px] font-normal transition-all",
                                  pathname === sub.url
                                    ? "bg-[#4A706A] text-white"
                                    : "text-[#5D5D5D] hover:bg-[#DEE9E6]/60 hover:text-[#141F1E]"
                                )}
                              >
                                {sub.title}
                              </Link>
                            ))}
                          </div>
                        )}
                      </React.Fragment>
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}
        </div>
      </aside>

      <Sidebar
        collapsible="none"
        className={cn(
          "bg-[#F7F7F7] h-full transition-all duration-300 ease-in-out overflow-hidden shrink-0 flex flex-col",
          isCollapsed
            ? "w-0 opacity-0 border-none pointer-events-none"
            : "w-[260px] opacity-100",
        )}
      >
        {/* Header with logo and menu toggle */}
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
            onClick={() => {
              if (isMobile) {
                setOpenMobile(!openMobile);
              } else {
                setOpen(!open);
              }
            }}
            className="size-8 hover:bg-[#DEE9E6] hover:text-[#4A706A] shrink-0"
          >
            <Menu className="size-5" />
          </Button>
        </SidebarHeader>

        {/* Navigation Items */}
        <SidebarContent className="flex-1 py-4 px-3 custom-scrollbar overflow-y-auto">
          {renderNavItems()}
        </SidebarContent>

        {/* Need Help Card */}
        {/* <div className="px-3 pb-4 shrink-0">
          <Card variant={'surface'} className="bg-white flex flex-col justify-start gap-0 items-center">
            <div className="flex items-center gap-2 w-full flex-row  mb-3">
              <ShieldIcon className="size-5 text-[#4A706A]" strokeWidth={1.5} />
              <Text size={'md'} weight={'semibold'}>
                Need help?
              </Text>
            </div>

            <Button
              className="w-full"
              type="button"
              variant="outline"
              size={'lg'}>
              Contact Support
            </Button>
          </Card>
        </div> */}
      </Sidebar>
    </div>
  );
}
