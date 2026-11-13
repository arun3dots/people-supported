"use client";

import React from "react";
import {
  Calendar,
  CheckCircle2,
  Download,
  Heart,
  Plus,
  Send,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Badge,
  Button,
  SummaryCardsGrid,
  Text,
  type SummaryCardItem,
} from "@repo/ui/components/ui";

export interface RotaHeaderMetrics {
  peopleSupportedCount: number;
  commissionedHours: number;
  deliveredHours: number;
  plannedHours: number;
  completionRate: number;
}

interface SupportHoursRotaHeaderProps {
  metrics: RotaHeaderMetrics;
  activeView: "rota" | "hours";
  selectedMonth: string;
  selectedWeek: string;
  draftShiftCount?: number;
  onPublishRota?: () => void;
  isPublishing?: boolean;
  onCreateShift: () => void;
  onExport: () => void;
}

export function SupportHoursRotaHeader({
  metrics,
  activeView,
  selectedMonth: _selectedMonth,
  selectedWeek,
  draftShiftCount = 0,
  onPublishRota,
  isPublishing = false,
  onCreateShift,
  onExport,
}: SupportHoursRotaHeaderProps): React.JSX.Element {
  const getHeaderTitle = () => {
    switch (activeView) {
      case "hours":
        return "Hours Summary";
      default:
        return "Support Hours & Rota";
    }
  };

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
            {getHeaderTitle()}
          </Text>
          <Text size="md" variant="muted" className="mt-0.5">
            Plan and track weekly staff rotas, care types (Shared, 1:1, Sleep-in, Waking Night) and commissioned support hours.
          </Text>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">

          <Badge
            variant="secondary"
            className="h-9 px-3 rounded-xl bg-surface-card-grey text-slate-700 font-medium hidden md:inline-flex"
          >
            {selectedWeek}
          </Badge>

          {/*<Button
            variant="secondary"
            size="sm"
            onClick={onExport}
            className="h-9 rounded-xl px-3 bg-surface-card-grey hover:bg-slate-200/70 text-slate-700 font-medium"
          >
            <Download className="size-3.5" />
            Export Report
          </Button>*/}

          {draftShiftCount > 0 && onPublishRota && (
            <Button
              onClick={onPublishRota}
              variant="outline"
              size="sm"
              disabled={isPublishing}
              className="h-9 rounded-xl px-3 border-emerald-300 text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100 font-medium"
            >
              <Send className="size-3.5 text-emerald-700" />
              {isPublishing ? "Publishing..." : `Publish Rota (${draftShiftCount})`}
            </Button>
          )}

          {draftShiftCount === 0 && metrics.plannedHours > 0 && (
            <Badge
              variant="outline"
              className="h-9 px-3 rounded-xl border-emerald-300 bg-emerald-50 text-emerald-800 font-medium gap-1.5"
            >
              <CheckCircle2 className="size-3.5 text-emerald-700" />
              Rota Published
            </Badge>
          )}

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

      {/* 4 KPI Cards: Displayed on Rota View */}
      {activeView === "rota" && (
        <SummaryCardsGrid
          cards={kpiCards}
          className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        />
      )}
    </div>
  );
}
