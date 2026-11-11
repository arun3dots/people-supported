"use client";

import React from "react";
import {
  Search,
  Plus,
  Settings2,
  Users,
  Building2,
  Calendar,
  Table,
} from "lucide-react";
import {
  Input,
  Button,
  Text,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui";

export type RotaLayoutMode = "timeline" | "table";

interface RotaHeaderProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  layoutMode?: RotaLayoutMode;
  onLayoutModeChange?: (mode: RotaLayoutMode) => void;
  viewMode: "shift" | "staff" | "facility";
  onViewModeChange: (mode: "staff" | "facility") => void;
  dateFilter: "today" | "this_week" | "custom";
  onDateFilterChange: (filter: "today" | "this_week" | "custom") => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  onAddShift: () => void;
  onOpenSettings: () => void;
}

export function RotaHeader({
  layoutMode = "timeline",
  onLayoutModeChange,
  viewMode,
  onViewModeChange,
  searchQuery = "",
  onSearchQueryChange,
  onAddShift,
  onOpenSettings,
}: RotaHeaderProps) {
  return (
    <div className="space-y-6 mb-6 font-sans">
      {/* Top Title & Primary Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Text size="xl" weight="bold">
            Shift Planner
          </Text>
          <Text size="md" weight="regular" className="text-slate-500 mt-1">
            Plan, manage, and publish care home staff rotas, resident pairings, and bed assignments.
          </Text>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={onOpenSettings}
            className="rounded-xl gap-2 h-10 px-4 shadow-none"
          >
            <Settings2 className="size-4 text-slate-700" />
            Shift Types
          </Button>
          <Button
            variant="primary"
            onClick={() => onAddShift()}
            className="rounded-xl gap-2 h-10 px-4 shadow-none"
          >
            <Plus className="size-4" />
            Add Shift
          </Button>
        </div>
      </div>

      {/* Filter & View Switcher Bar - Single Line */}
      <div className="flex items-center justify-between gap-3 pt-1 w-full flex-nowrap overflow-x-auto no-scrollbar">
        {/* Search Input - flexibly fills space up to controls */}
        <div className="relative flex-1 min-w-[200px] max-w-xl [&_[data-slot=input-error]]:hidden">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none z-10" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchQueryChange?.(e.target.value)}
            placeholder="Search staff, role, shift..."
            className="w-full h-11 pl-10 pr-4 bg-white border-slate-200 rounded-xl text-md text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-primary shadow-none"
          />
        </div>

        {/* Right Controls: Timeline / Table View toggle & View By Tabs */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* View Mode Toggle (Timeline vs Table View) */}
          {onLayoutModeChange && (
            <div className="flex items-center gap-1.5 shrink-0">
              <Tabs
                value={layoutMode}
                onValueChange={(val) =>
                  onLayoutModeChange(val as RotaLayoutMode)
                }
              >
                <TabsList className="bg-surface-card-grey border border-slate-200/80 p-1 rounded-xl h-auto inline-flex items-center gap-1">
                  <TabsTrigger
                    value="timeline"
                    className="flex items-center justify-center px-3 py-1.5 gap-1.5 rounded-lg transition-all text-md font-medium cursor-pointer border-0 data-[state=active]:border-0 data-[state=active]:border-b-0 text-slate-500 hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs data-[state=active]:font-medium whitespace-nowrap"
                  >
                    <Calendar className="size-4 text-primary" />
                    Timeline View
                  </TabsTrigger>
                  <TabsTrigger
                    value="table"
                    className="flex items-center justify-center px-3 py-1.5 gap-1.5 rounded-lg transition-all text-md font-medium cursor-pointer border-0 data-[state=active]:border-0 data-[state=active]:border-b-0 text-slate-500 hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs data-[state=active]:font-medium whitespace-nowrap"
                  >
                    <Table className="size-4 text-primary" />
                    Table View
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {/* View By Tabs Toggle */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Text size="sm" weight="medium" className="text-slate-500 px-1 shrink-0">
              View By:
            </Text>
            <Tabs
              value={viewMode}
              onValueChange={(val) =>
                onViewModeChange(val as "staff" | "facility")
              }
            >
              <TabsList className="bg-surface-card-grey border border-slate-200/80 p-1 rounded-xl h-auto inline-flex items-center gap-1">
                <TabsTrigger
                  value="staff"
                  className="flex items-center justify-center px-3 py-1.5 gap-1.5 rounded-lg transition-all text-md font-medium cursor-pointer border-0 data-[state=active]:border-0 data-[state=active]:border-b-0 text-slate-500 hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs data-[state=active]:font-medium whitespace-nowrap"
                >
                  <Users className="size-4 text-primary" />
                  Staff Members
                </TabsTrigger>
                <TabsTrigger
                  value="facility"
                  className="flex items-center justify-center px-3 py-1.5 gap-1.5 rounded-lg transition-all text-md font-medium cursor-pointer border-0 data-[state=active]:border-0 data-[state=active]:border-b-0 text-slate-500 hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs data-[state=active]:font-medium whitespace-nowrap"
                >
                  <Building2 className="size-4 text-primary" />
                  Facility / Wings
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
