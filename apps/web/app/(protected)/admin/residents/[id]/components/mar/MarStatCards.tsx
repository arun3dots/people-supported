"use client";

import React from "react";
import { Bed, CheckCircle2, AlertCircle, Users, Wrench } from "lucide-react";
import { Card, Text } from "@repo/ui/components/ui";

interface MarStatCardsProps {
  dueTodayCount: number;
  administeredCount: number;
  missedCount: number;
  prnAvailableCount: number;
  onHoldCount: number;
  onOpenPrn?: () => void;
}

export function MarStatCards({
  dueTodayCount,
  administeredCount,
  missedCount,
  prnAvailableCount,
  onHoldCount,
  onOpenPrn,
}: MarStatCardsProps): React.JSX.Element {
  const cards = [
    {
      title: "Due Today",
      value: dueTodayCount,
      subtitle: "Medications",
      icon: Bed,
      cardBg: "bg-slate-50/80 border-slate-200/80",
      iconBoxBg: "bg-white border-slate-200/80 text-slate-700",
      valueColor: "text-slate-900",
      subColor: "text-slate-500",
    },
    {
      title: "Administered",
      value: administeredCount,
      subtitle: "Completed",
      icon: CheckCircle2,
      cardBg: "bg-emerald-50/60 border-emerald-200/80",
      iconBoxBg: "bg-white border-emerald-200/80 text-emerald-700",
      valueColor: "text-emerald-900",
      subColor: "text-emerald-700",
    },
    {
      title: "Missed",
      value: missedCount,
      subtitle: "Records",
      icon: AlertCircle,
      cardBg: "bg-red-50/60 border-red-200/80",
      iconBoxBg: "bg-white border-red-200/80 text-red-600",
      valueColor: "text-red-900",
      subColor: "text-red-600",
    },
    {
      title: "PRN Available",
      value: prnAvailableCount,
      subtitle: "On Demand",
      icon: Users,
      cardBg: "bg-sky-50/60 border-sky-200/80",
      iconBoxBg: "bg-white border-sky-200/80 text-sky-700",
      valueColor: "text-sky-900",
      subColor: "text-sky-700",
    },
    {
      title: "On Hold",
      value: onHoldCount,
      subtitle: "Medication",
      icon: Wrench,
      cardBg: "bg-amber-50/60 border-amber-200/80",
      iconBoxBg: "bg-white border-amber-200/80 text-amber-700",
      valueColor: "text-amber-900",
      subColor: "text-amber-700",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 font-sans">
      {cards.map((c, idx) => {
        const Icon = c.icon;
        return (
          <Card
            key={idx}
            variant="ghost"
            onClick={c.title === "PRN Available" && onOpenPrn ? onOpenPrn : undefined}
            className={`${c.cardBg} p-4.5 sm:p-5 min-h-[96px] rounded-2xl flex flex-row items-center gap-3 border shadow-2xs transition-all duration-200 hover:shadow-xs ${c.title === "PRN Available" && onOpenPrn ? "cursor-pointer hover:border-sky-300" : ""}`}
          >
            {/* Circle icon container on left side */}
            <div
              className={`size-9 sm:size-10 rounded-full ${c.iconBoxBg} border flex items-center justify-center shrink-0 shadow-2xs`}
            >
              <Icon className="size-4" />
            </div>

            {/* Metric Content on Right Side */}
            <div className="flex flex-col gap-0.5 min-w-0">
              <Text size="sm" weight="regular" className="text-slate-600 leading-none truncate">
                {c.title}
              </Text>
              <Text size="md" weight="bold" className={`${c.valueColor} leading-tight mt-0.5`}>
                {c.value}
              </Text>
              <Text size="sm" weight="regular" className={`${c.subColor} leading-none truncate`}>
                {c.subtitle}
              </Text>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
