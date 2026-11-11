"use client";

import {
  Users,
  HeartHandshake,
  ClipboardList,
  ShieldAlert,
} from "lucide-react";
import {
  SummaryCardsGrid,
  type SummaryCardItem,
} from "@repo/ui/components/ui/SummaryCard";

interface MetricsData {
  total: number;
  active: number;
  newAdmissions?: number;
  discharges?: number;
  avgAge?: number;
  branchCount?: number;
  reviewsDue?: number;
  highRiskCount?: number;
  inHospitalCount?: number;
}

interface MetricsCardsProps {
  metrics: MetricsData;
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const activePercent =
    metrics.total > 0 ? Math.round((metrics.active / metrics.total) * 100) : 0;

  const cards: SummaryCardItem[] = [
    {
      title: "People Supported",
      value: String(metrics.total),
      subtitle: metrics.branchCount
        ? `Across ${metrics.branchCount} properties`
        : "Registered people supported",
      subtitleColor: "text-slate-500",
      icon: <Users className="size-5 text-slate-700" />,
      iconClassName: "bg-white border border-slate-200/80",
    },
    {
      title: "Active Tenancies",
      value: String(metrics.active),
      subtitle: `${activePercent}% active tenancies`,
      subtitleColor: "text-emerald-800 font-medium",
      icon: <HeartHandshake className="size-5 text-emerald-700" />,
      iconClassName: "bg-emerald-50 border border-emerald-200/70",
    },
    {
      title: "Plan Reviews Due",
      value: String(metrics.reviewsDue ?? 0),
      subtitle: "Due within 30 days",
      subtitleColor: "text-amber-700 font-medium",
      icon: <ClipboardList className="size-5 text-amber-700" />,
      iconClassName: "bg-amber-50 border border-amber-200/70",
    },
    {
      title: "High Risk",
      value: String(metrics.highRiskCount ?? 0),
      subtitle: "Enhanced support plans",
      subtitleColor: "text-red-700 font-medium",
      icon: <ShieldAlert className="size-5 text-red-700" />,
      iconClassName: "bg-red-50 border border-red-200/70",
    },
  ];

  return (
    <SummaryCardsGrid
      cards={cards}
      className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 font-sans"
    />
  );
}
