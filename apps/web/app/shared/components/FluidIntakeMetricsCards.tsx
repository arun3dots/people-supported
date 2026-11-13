"use client";

import React from "react";
import { Droplet, Utensils, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, Text } from "@repo/ui/components/ui";
import type { FoodFluidSummaryDTO } from "@repo/schema";
import type { FoodFluidLogItem } from "../../../lib/queries/residents/useGetFoodFluidLogsQuery";

interface FluidIntakeMetricsCardsProps {
  summary?: FoodFluidSummaryDTO;
  logs?: FoodFluidLogItem[];
  totalLogsCount: number;
  selectedDate?: Date;
}

export function FluidIntakeMetricsCards({
  summary,
  logs = [],
  totalLogsCount,
  selectedDate,
}: FluidIntakeMetricsCardsProps) {
  const dailyTarget = summary?.dailyTargetMl ?? 2000;

  // Real-time computation from loaded logs so intakePercentage adjustments update immediately
  const fluidLogs = logs.filter((l) => l.type === "Fluid");
  const computedTotal = fluidLogs.reduce((acc, curr) => {
    const pct =
      curr.intakePercentage !== null && curr.intakePercentage !== undefined
        ? curr.intakePercentage / 100
        : 1;
    return acc + Math.round(Number(curr.amount || 0) * pct);
  }, 0);

  const currentTotal = logs.length > 0 ? computedTotal : (summary?.totalFluidIntakeMl ?? 0);
  const progressPct = Math.min(Math.round((currentTotal / dailyTarget) * 100), 100);
  const isDehydrationRisk = progressPct < 50;

  let statusText = summary?.statusLabel;
  if (logs.length > 0 || !statusText) {
    if (progressPct >= 100) statusText = "Target Met";
    else if (progressPct >= 75) statusText = "Good Progress";
    else if (progressPct < 50) statusText = "Dehydration Risk";
    else statusText = "On Track";
  }

  const cards = [
    {
      title: "Total Fluid Intake",
      value: `${currentTotal.toLocaleString()} ml`,
      subtitle: `Target: ${dailyTarget.toLocaleString()} ml`,
      icon: Droplet,
      cardBg: "bg-teal-50/60 border-teal-200/80",
      iconBoxBg: "bg-white border-teal-200/80 text-[#4A706A]",
      valueColor: "text-[#2D4A45]",
      subColor: "text-[#4A706A]",
    },
    {
      title: "Target Progress",
      value: `${progressPct}%`,
      subtitle: isDehydrationRisk
        ? "Below target"
        : progressPct >= 100
          ? "Target reached"
          : `${Math.max(dailyTarget - currentTotal, 0)} ml left`,
      icon: TrendingUp,
      cardBg: isDehydrationRisk ? "bg-amber-50/60 border-amber-200/80" : "bg-emerald-50/60 border-emerald-200/80",
      iconBoxBg: isDehydrationRisk ? "bg-white border-amber-200/80 text-amber-700" : "bg-white border-emerald-200/80 text-emerald-700",
      valueColor: isDehydrationRisk ? "text-amber-900" : "text-emerald-900",
      subColor: isDehydrationRisk ? "text-amber-700" : "text-emerald-700",
    },
    {
      title: "Hydration Status",
      value: statusText,
      subtitle: isDehydrationRisk ? "Needs fluid prompt" : "Hydration adequate",
      icon: isDehydrationRisk ? AlertTriangle : CheckCircle2,
      cardBg: isDehydrationRisk ? "bg-red-50/60 border-red-200/80" : "bg-sky-50/60 border-sky-200/80",
      iconBoxBg: isDehydrationRisk ? "bg-white border-red-200/80 text-red-600" : "bg-white border-sky-200/80 text-sky-700",
      valueColor: isDehydrationRisk ? "text-red-900" : "text-sky-900",
      subColor: isDehydrationRisk ? "text-red-600" : "text-sky-700",
    },
    {
      title: "Entries Logged",
      value: String(totalLogsCount),
      subtitle: selectedDate ? "Selected date" : "All dates",
      icon: Utensils,
      cardBg: "bg-slate-50/80 border-slate-200/80",
      iconBoxBg: "bg-white border-slate-200/80 text-slate-700",
      valueColor: "text-slate-900",
      subColor: "text-slate-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 font-sans">
      {cards.map((c, idx) => {
        const Icon = c.icon;
        return (
          <Card
            key={idx}
            variant="ghost"
            className={`${c.cardBg} p-4.5 sm:p-5 min-h-[96px] rounded-2xl flex flex-row items-center gap-3 border shadow-2xs transition-all duration-200 hover:shadow-xs`}
          >
            {/* Circle icon container on left side matching MarStatCards */}
            <div
              className={`size-9 sm:size-10 rounded-full ${c.iconBoxBg} border flex items-center justify-center shrink-0 shadow-2xs`}
            >
              <Icon className="size-4" />
            </div>

            {/* Metric Content on Right Side matching MarStatCards font sizing */}
            <div className="flex flex-col gap-0.5 min-w-0">
              <Text size="md" weight="regular" className="text-slate-600 leading-none truncate">
                {c.title}
              </Text>
              <Text size="md" weight="bold" className={`${c.valueColor} leading-tight mt-0.5`}>
                {c.value}
              </Text>
              <Text size="md" weight="regular" className={`${c.subColor} leading-none truncate`}>
                {c.subtitle}
              </Text>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
