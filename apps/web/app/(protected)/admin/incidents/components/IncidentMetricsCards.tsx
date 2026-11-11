"use client";

import React from "react";
import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import {
  SummaryCardsGrid,
  type SummaryCardItem,
} from "@repo/ui/components/ui/SummaryCard";
import type { IncidentMetrics } from "../../../../../lib/types/incident";

interface IncidentMetricsCardsProps {
  metrics: IncidentMetrics;
}

export function IncidentMetricsCards({ metrics }: IncidentMetricsCardsProps) {
  const openPercent =
    metrics.total > 0
      ? ((metrics.open / metrics.total) * 100).toFixed(1)
      : "0";

  const cards: SummaryCardItem[] = [
    {
      title: "Total Incidents",
      value: String(metrics.total),
      subtitle: "Logged in system",
      icon: <AlertTriangle className="size-5 text-emerald-800" />,
      subtitleColor: "text-slate-500",
    },
    {
      title: "Open Incidents",
      value: String(metrics.open),
      subtitle: `${openPercent}% of total incidents`,
      icon: <Clock className="size-5 text-amber-700" />,
      subtitleColor: "text-amber-700 font-medium",
    },
    {
      title: "Under Investigation",
      value: String(metrics.underReview),
      subtitle: "Requires review & sign-off",
      icon: <ShieldAlert className="size-5 text-red-700" />,
      subtitleColor: "text-red-700 font-medium",
    },
    {
      title: "Overdue Action",
      value: String(metrics.overdue),
      subtitle: "Past response target",
      icon: <AlertCircle className="size-5 text-blue-700" />,
      subtitleColor: "text-blue-700 font-medium",
    },
    // {
    //   title: "Closed This Month",
    //   value: String(metrics.closedThisMonth || metrics.closed),
    //   subtitle: "Resolved & compliant",
    //   icon: <ShieldCheck className="size-5 text-emerald-800" />,
    //   subtitleColor: "text-emerald-800 font-medium",
    // },
  ];

  return (
    <SummaryCardsGrid
      cards={cards}
      className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 font-sans"
    />
  );
}
