"use client";

import {
  Users,
  HeartHandshake,
  ClipboardList,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

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

interface MetricCard {
  title: string;
  value: string;
  subtitle: string;
  subtitleColor: string;
  icon: LucideIcon;
  cardBg: string;
  iconColor: string;
  valueColor: string;
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const activePercent =
    metrics.total > 0 ? Math.round((metrics.active / metrics.total) * 100) : 0;

  const cards: MetricCard[] = [
    {
      title: "People Supported",
      value: String(metrics.total),
      subtitle: metrics.branchCount
        ? "Across " + metrics.branchCount + " properties"
        : "Registered people supported",
      subtitleColor: "text-slate-500",
      icon: Users,
      cardBg: "bg-white border-slate-200/80",
      iconColor: "text-slate-700",
      valueColor: "text-slate-900",
    },
    {
      title: "Active Tenancies",
      value: String(metrics.active),
      subtitle: activePercent + "% active tenancies",
      subtitleColor: "text-emerald-800",
      icon: HeartHandshake,
      cardBg: "bg-emerald-50/70 border-emerald-200/80",
      iconColor: "text-emerald-700",
      valueColor: "text-emerald-800",
    },
    {
      title: "Plan Reviews Due",
      value: String(metrics.reviewsDue ?? 0),
      subtitle: "Due within 30 days",
      subtitleColor: "text-amber-700",
      icon: ClipboardList,
      cardBg: "bg-amber-50/70 border-amber-200/80",
      iconColor: "text-amber-700",
      valueColor: "text-amber-800",
    },
    {
      title: "High Risk",
      value: String(metrics.highRiskCount ?? 0),
      subtitle: "Enhanced support plans",
      subtitleColor: "text-red-700",
      icon: ShieldAlert,
      cardBg: "bg-red-50/60 border-red-200/80",
      iconColor: "text-red-700",
      valueColor: "text-red-800",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4 font-sans">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={cn(
              card.cardBg,
              "border rounded-2xl p-4 sm:p-5 space-y-1 shadow-2xs transition-all",
            )}
          >
            <div className="flex items-center gap-2">
              <Icon className={cn("size-4", card.iconColor)} />
              <span className="text-md font-bold text-slate-700">
                {card.title}
              </span>
            </div>
            <div className={cn("text-2xl font-extrabold", card.valueColor)}>
              {card.value}
            </div>
            <p className={cn("text-md font-medium", card.subtitleColor)}>
              {card.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
}
