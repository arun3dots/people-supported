"use client";

import React from "react";
import {
  Calendar,
  Download,
  Heart,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button, Card, Text } from "@repo/ui/components/ui";

export interface RotaHeaderMetrics {
  peopleSupportedCount: number;
  commissionedHours: number;
  deliveredHours: number;
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
  return (
    <div className="space-y-5 font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Text as="span" size="md" weight="medium" variant="subdued">Support Hours &amp; Rota</Text>
            <Text as="span" size="md" variant="subdued">&rsaquo;</Text>
            <Text as="span" size="md" weight="semibold">All Properties</Text>
          </div>
          <Text as="h1" size="2xl" weight="semibold" className="tracking-tight">
            Support Hours &amp; Rota
          </Text>
          <Text size="md" variant="subdued" className="mt-0.5">
            Plan and track weekly staff rotas, care types (Shared, 1:1, Sleep-in, Waking Night) and commissioned support hours.
          </Text>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <Calendar className="size-4 text-slate-500" />
            <Text as="span" size="md" weight="medium">{selectedMonth}</Text>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <Text as="span" size="md" weight="medium">{selectedWeek}</Text>
          </div>

          <Button
            variant="outline"
            onClick={onExport}
            className="h-9 rounded-xl px-3"
          >
            <Download className="size-3.5" />
            Export Report
          </Button>

          <Button
            onClick={onCreateShift}
            variant="primary"
            className="h-9 rounded-xl px-3.5 shadow-2xs"
          >
            <Plus className="size-3.5" />
            Create Rota
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <Card variant="white" border="secondary" className="p-4 sm:p-5 gap-1 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Users className="size-4 text-primary" />
            <Text as="span" size="md" weight="medium">People Supported</Text>
          </div>
          <Text size="2xl" weight="semibold">{metrics.peopleSupportedCount}</Text>
          <Text size="md" variant="subdued">Across registered homes</Text>
        </Card>

        <Card variant="white" border="secondary" className="p-4 sm:p-5 gap-1 shadow-2xs bg-primary/5">
          <div className="flex items-center gap-2 text-primary">
            <Heart className="size-4 text-primary" />
            <Text as="span" size="md" weight="medium" variant="primary">Commissioned / Week</Text>
          </div>
          <Text size="2xl" weight="semibold" variant="primary">{metrics.commissionedHours} hrs</Text>
          <Text size="md" variant="primary">LA approved hours</Text>
        </Card>

        <Card variant="white" border="secondary" className="p-4 sm:p-5 gap-1 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="size-4 text-slate-500" />
            <Text as="span" size="md" weight="medium">Delivered / Week</Text>
          </div>
          <Text size="2xl" weight="semibold">{metrics.deliveredHours} hrs</Text>
          <Text size="md" variant="subdued">Planned roster hours</Text>
        </Card>

        <Card variant="white" border="secondary" className="p-4 sm:p-5 gap-1 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-600">
            <TrendingUp className="size-4 text-primary" />
            <Text as="span" size="md" weight="medium">Completion Rate</Text>
          </div>
          <Text size="2xl" weight="semibold">{metrics.completionRate}%</Text>
          <Text size="md" variant="subdued">Staffing target met</Text>
        </Card>
      </div>

      {/* View Pills + Care Type Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {(
            [
              { id: "rota", label: "Rota" },
              { id: "hours", label: "Hours Summary" },
              { id: "allocation", label: "Staff Allocation" },
            ] as const
          ).map((v) => (
            <Button
              key={v.id}
              type="button"
              size="sm"
              variant={activeView === v.id ? "primary" : "ghost"}
              onClick={() => onViewChange(v.id)}
              className="h-9 rounded-lg px-3 transition-all"
            >
              {v.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {CARE_TYPE_FILTERS.map((f) => (
            <Button
              key={f.id}
              type="button"
              size="sm"
              variant={activeCareType === f.id ? "primary" : "outline"}
              onClick={() => onCareTypeChange(f.id)}
              className="h-9 rounded-full px-3 transition-all"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
