"use client";

import React from "react";
import {
  Users,
  AlertOctagon,
  FileEdit,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  ShieldAlert,
  History,
} from "lucide-react";
import { Card, Text } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import type { CarePlanFilterTab } from "./types";

export interface CarePlanMetricsStats {
  totalResidents: number;
  missingPlanCount: number;
  draftCount: number;
  awaitingApprovalCount: number;
  returnedCount: number;
  activeCount: number;
  reviewOverdueCount: number;
  due14Count: number;
  recordChangedCount: number;
  updated7Count: number;
}

interface CarePlanStatCardsProps {
  stats: CarePlanMetricsStats;
  activeTab: CarePlanFilterTab;
  onSelectTab: (tab: CarePlanFilterTab) => void;
}

export function CarePlanStatCards({
  stats,
  activeTab,
  onSelectTab,
}: CarePlanStatCardsProps) {
  const topCards: Array<{
    id: CarePlanFilterTab;
    title: string;
    value: number;
    subtitle: string;
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    valueVariant?: "error" | "default";
  }> = [
    {
      id: "ALL",
      title: "All residents",
      value: stats.totalResidents,
      subtitle: "in residence or pre-admission",
      icon: <Users className="size-4" />,
      iconBg: "bg-slate-100",
      iconColor: "text-slate-700",
    },
    {
      id: "MISSING",
      title: "Missing plan",
      value: stats.missingPlanCount,
      subtitle: "no care plan",
      icon: <AlertOctagon className="size-4" />,
      iconBg: "bg-rose-100",
      iconColor: "text-rose-700",
      valueVariant: "error",
    },
    {
      id: "DRAFT",
      title: "Draft",
      value: stats.draftCount,
      subtitle: "new plans & open revisions",
      icon: <FileEdit className="size-4" />,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-800",
    },
    {
      id: "AWAITING_APPROVAL",
      title: "Awaiting approval",
      value: stats.awaitingApprovalCount,
      subtitle: "needs RM / RN sign-off",
      icon: <Clock className="size-4" />,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-700",
    },
    {
      id: "RETURNED",
      title: "Returned",
      value: stats.returnedCount,
      subtitle: "changes requested",
      icon: <RotateCcw className="size-4" />,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-700",
    },
    {
      id: "ACTIVE",
      title: "Active",
      value: stats.activeCount,
      subtitle: "approved version in use",
      icon: <CheckCircle2 className="size-4" />,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-700",
    },
    {
      id: "REVIEW_OVERDUE",
      title: "Review overdue",
      value: stats.reviewOverdueCount,
      subtitle: "past review date",
      icon: <AlertTriangle className="size-4" />,
      iconBg: "bg-rose-100",
      iconColor: "text-rose-700",
      valueVariant: "error",
    },
  ];

  const bottomCards: Array<{
    id: CarePlanFilterTab;
    title: string;
    value: number;
    subtitle: string;
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    valueVariant?: "warning" | "error" | "default";
  }> = [
    {
      id: "DUE_14_DAYS",
      title: "Due ≤ 14 days",
      value: stats.due14Count,
      subtitle: "upcoming reviews",
      icon: <Calendar className="size-4" />,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-800",
      valueVariant: "warning",
    },
    {
      id: "RECORD_CHANGED",
      title: "Record changed",
      value: stats.recordChangedCount,
      subtitle: "safety info changed since approval",
      icon: <ShieldAlert className="size-4" />,
      iconBg: "bg-rose-100",
      iconColor: "text-rose-700",
      valueVariant: "error",
    },
    {
      id: "UPDATED_7_DAYS",
      title: "Updated ≤ 7 days",
      value: stats.updated7Count,
      subtitle: "recent activity",
      icon: <History className="size-4" />,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-700",
    },
  ];

  const renderCard = (card: {
    id: CarePlanFilterTab;
    title: string;
    value: number;
    subtitle: string;
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    valueVariant?: "warning" | "error" | "default";
  }) => {
    const isSelected = activeTab === card.id;

    return (
      <Card
        key={card.id}
        variant="surface"
        onClick={() => onSelectTab(card.id)}
        className={cn(
          "p-3.5 rounded-2xl cursor-pointer transition-all duration-150 flex flex-col justify-between min-h-[96px] text-left gap-0",
          isSelected
            ? "ring-2 ring-emerald-800 border-emerald-800 shadow-sm bg-emerald-50/20"
            : "border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50 shadow-xs"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <Text size="md" weight="semibold" className="text-slate-700 leading-tight truncate">
            {card.title}
          </Text>
          <div
            className={cn(
              "size-7 rounded-lg flex items-center justify-center shrink-0",
              card.iconBg,
              card.iconColor
            )}
          >
            {card.icon}
          </div>
        </div>

        <div className="mt-1">
          <Text
            size="xl"
            weight="bold"
            variant={card.valueVariant || "default"}
            className="tracking-tight leading-none"
          >
            {card.value}
          </Text>
          <Text
            size="md"
            variant="muted"
            className="text-md text-slate-500 mt-1 leading-snug line-clamp-1"
          >
            {card.subtitle}
          </Text>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-3 font-sans">
      {/* Top lifecycle cards (7) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {topCards.map(renderCard)}
      </div>

      {/* Secondary timeline/audit metrics cards (3) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {bottomCards.map(renderCard)}
      </div>
    </div>
  );
}
