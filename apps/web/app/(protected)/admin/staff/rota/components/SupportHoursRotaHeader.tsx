"use client";

import React from "react";
import {
  Calendar,
  Clock,
  Download,
  Heart,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Badge,
  Button,
  SummaryCardsGrid,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
  type SummaryCardItem,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";

export interface RotaHeaderMetrics {
  peopleSupportedCount: number;
  commissionedHours: number;
  deliveredHours: number;
  plannedHours: number;
  completionRate: number;
}

interface SupportHoursRotaHeaderProps {
  metrics: RotaHeaderMetrics;
  activeView: "rota" | "hours" | "allocation";
  onViewChange: (view: "rota" | "hours" | "allocation") => void;
  activeCareType: string;
  onCareTypeChange: (careType: string) => void;
  selectedMonth: string;
  onMonthChange?: (month: string) => void;
  selectedWeek: string;
  onWeekChange?: (week: string) => void;
  onCreateShift: () => void;
  onExport: () => void;
}

const CARE_TYPE_FILTERS = [
  { id: "All Care Types", label: "All Care Types" },
  { id: "Shared Care (Core Support)", label: "Shared Care" },
  { id: "1:1 Dedicated Support", label: "1:1 Support" },
  { id: "Sleep-in (Overnight)", label: "Sleep-in" },
  { id: "Waking Night", label: "Waking Night" },
];

export function SupportHoursRotaHeader({
  metrics,
  activeView,
  onViewChange,
  activeCareType,
  onCareTypeChange,
  selectedMonth,
  selectedWeek,
  onCreateShift,
  onExport,
}: SupportHoursRotaHeaderProps): React.JSX.Element {
  const kpiCards: SummaryCardItem[] = [
    {
      title: "People Supported",
      value: metrics.peopleSupportedCount,
      subtitle: "Across registered homes",
      subtitleColor: "text-slate-500",
      icon: <Users className="size-5 text-primary" />,
      iconClassName: "bg-slate-100",
    },
    {
      title: "Commissioned / Week",
      value: `${metrics.commissionedHours} hrs`,
      subtitle:
        metrics.commissionedHours > 0
          ? "LA approved hours"
          : "No commissioned target set",
      subtitleColor:
        metrics.commissionedHours > 0
          ? "text-primary font-medium"
          : "text-slate-500",
      icon: <Heart className="size-5 text-primary" />,
      iconClassName: "bg-emerald-50",
    },
    {
      title: "Delivered / Week",
      value: `${metrics.deliveredHours} hrs`,
      subtitle: `${metrics.plannedHours} hrs planned this week`,
      subtitleColor: "text-slate-500",
      icon: <Calendar className="size-5 text-slate-700" />,
      iconClassName: "bg-slate-100",
    },
    {
      title: "Completion Rate",
      value: `${metrics.completionRate}%`,
      subtitle:
        metrics.commissionedHours > 0
          ? "vs commissioned hours"
          : metrics.plannedHours > 0
            ? "vs planned hours"
            : "No shift hours logged",
      subtitleColor:
        metrics.completionRate >= 90
          ? "text-emerald-800 font-medium"
          : "text-slate-500",
      icon: <TrendingUp className="size-5 text-emerald-700" />,
      iconClassName: "bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-5 font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Text as="span" size="md" weight="medium" variant="muted">
              Support Hours &amp; Rota
            </Text>
            <Text as="span" size="md" variant="muted">
              &rsaquo;
            </Text>
            <Text as="span" size="md" weight="medium" className="text-slate-800">
              All Properties
            </Text>
          </div>
          <Text as="h1" size="2xl" weight="semibold" className="tracking-tight text-slate-900">
            Support Hours &amp; Rota
          </Text>
          <Text size="md" variant="muted" className="mt-0.5">
            Plan and track weekly staff rotas, care types (Shared, 1:1, Sleep-in, Waking Night) and commissioned support hours.
          </Text>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Badge
            variant="secondary"
            className="h-9 px-3 rounded-xl bg-surface-card-grey text-slate-700 font-medium gap-1.5"
          >
            <Calendar className="size-3.5 text-slate-500" />
            {selectedMonth}
          </Badge>

          <Badge
            variant="secondary"
            className="h-9 px-3 rounded-xl bg-surface-card-grey text-slate-700 font-medium"
          >
            {selectedWeek}
          </Badge>

          <Button
            variant="secondary"
            size="sm"
            onClick={onExport}
            className="h-9 rounded-xl px-3 bg-surface-card-grey hover:bg-slate-200/70 text-slate-700 font-medium"
          >
            <Download className="size-3.5" />
            Export Report
          </Button>

          <Button
            onClick={onCreateShift}
            variant="primary"
            size="sm"
            className="h-9 rounded-xl px-3.5 font-medium"
          >
            <Plus className="size-3.5" />
            Create Rota
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <SummaryCardsGrid
        cards={kpiCards}
        className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      />

      {/* Underline Navigation Tabs + Borderless Care Type Filter Chips */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 pb-0">
        <Tabs
          value={activeView}
          onValueChange={(value) =>
            onViewChange(value as "rota" | "hours" | "allocation")
          }
          className="gap-0"
        >
          <TabsList className="w-full justify-start bg-transparent p-0 h-auto rounded-none gap-6 flex-wrap -mb-px">
            <TabsTrigger value="rota" className="flex items-center gap-1.5 px-0 pb-3 pt-1">
              <Calendar className="size-4 text-primary" />
              Shift Planner
            </TabsTrigger>
            <TabsTrigger value="hours" className="flex items-center gap-1.5 px-0 pb-3 pt-1">
              <Clock className="size-4 text-primary" />
              Hours Summary
            </TabsTrigger>
            <TabsTrigger value="allocation" className="flex items-center gap-1.5 px-0 pb-3 pt-1">
              <Users className="size-4 text-primary" />
              Staff Allocation
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-1.5 pb-2.5">
          {CARE_TYPE_FILTERS.map((f) => {
            const isActive = activeCareType === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onCareTypeChange(f.id)}
                className={cn(
                  "h-8 rounded-full px-3.5 text-md font-medium transition-colors cursor-pointer",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-card-grey text-slate-600 hover:bg-slate-200/70 hover:text-slate-900",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
