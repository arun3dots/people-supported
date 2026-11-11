"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import type { NavItem } from "./roleNavigation";
import {
  isNavItemActive,
  isSubItemActive,
  type SearchParamsReader,
} from "./navActiveMatcher";

interface CollapsedSidebarStripProps {
  isCollapsed: boolean;
  allItems: NavItem[];
  pathname: string;
  searchParams: SearchParamsReader | null;
  onToggleSidebar: () => void;
}

export function CollapsedSidebarStrip({
  isCollapsed,
  allItems,
  pathname,
  searchParams,
  onToggleSidebar,
}: CollapsedSidebarStripProps): React.JSX.Element {
  const [hoveredGroup, setHoveredGroup] = React.useState<string | null>(null);

  return (
    <aside
      className={cn(
        "flex flex-col items-center bg-[#F7F7F7] border-r border-[#E5E5E5] py-4 flex-shrink-0 z-50 transition-all duration-300 ease-in-out overflow-hidden h-full",
        isCollapsed
          ? "w-[70px] opacity-100"
          : "w-0 opacity-0 p-0 border-none pointer-events-none",
      )}
    >
      <div className="h-16 flex items-center justify-center shrink-0 mb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="size-9 hover:bg-[#DEE9E6] hover:text-[#4A706A] shrink-0"
        >
          <Menu className="size-5" />
        </Button>
      </div>

      <div className="flex flex-col gap-3 px-2 overflow-y-auto w-full items-center">
        {allItems.map((item) => {
          const isGroupActive = isNavItemActive(item, pathname, searchParams);
          const ItemIcon = item.icon;

          if (!item.hasSubmenu) {
            return (
              <Link
                key={item.title}
                href={item.url === "#" ? "#" : item.url}
                className={cn(
                  "w-11 h-11 rounded-[10px] flex items-center justify-center transition-all duration-200 cursor-pointer",
                  isGroupActive
                    ? "bg-[#4A706A] text-white"
                    : "text-[#141F1E] hover:bg-[#DEE9E6]/60",
                )}
                title={item.title}
              >
                <ItemIcon className="size-5" strokeWidth={1.5} />
              </Link>
            );
          }

          return (
            <Popover
              key={item.title}
              open={isCollapsed && hoveredGroup === item.title}
              onOpenChange={(isOpen) => {
                if (!isOpen) setHoveredGroup(null);
              }}
            >
              <PopoverTrigger asChild>
                <div
                  onMouseEnter={() => isCollapsed && setHoveredGroup(item.title)}
                  onMouseLeave={() => setHoveredGroup(null)}
                >
                  <button
                    type="button"
                    title={item.title}
                    className={cn(
                      "w-11 h-11 rounded-[10px] flex items-center justify-center transition-all duration-200 cursor-pointer",
                      isGroupActive
                        ? "bg-[#4A706A] text-white"
                        : "text-[#141F1E] hover:bg-[#DEE9E6]/60",
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
                onMouseEnter={() => setHoveredGroup(item.title)}
                onMouseLeave={() => setHoveredGroup(null)}
              >
                <div className="text-md font-semibold text-[#4A706A] tracking-[0.15em] uppercase mb-2 px-2">
                  {item.title}
                </div>
                <div className="flex flex-col gap-1">
                  <Link
                    href={item.url === "#" ? "#" : item.url}
                    className={cn(
                      "flex items-center gap-2.5 py-2.5 px-2 rounded-[8px] transition-all",
                      isGroupActive
                        ? "bg-[#4A706A] text-white"
                        : "text-[#141F1E] hover:bg-[#DEE9E6]/60",
                    )}
                  >
                    <item.icon className="size-4 shrink-0" strokeWidth={1.5} />
                    <span className="text-[13px] leading-[17px] font-normal">
                      {item.title}
                    </span>
                  </Link>
                  {item.subItems && (
                    <div className="flex flex-col gap-0.5 pl-2 ml-2 border-l border-[#E5E5E5] mb-1">
                      {item.subItems.map((sub) => {
                        const subActive = isSubItemActive(
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
                              "py-2 px-2 rounded-[8px] text-md leading-[16px] font-normal transition-all",
                              subActive
                                ? "bg-[#4A706A] text-white"
                                : "text-[#5D5D5D] hover:bg-[#DEE9E6]/60 hover:text-[#141F1E]",
                            )}
                          >
                            {sub.title}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          );
        })}
      </div>
    </aside>
  );
}
