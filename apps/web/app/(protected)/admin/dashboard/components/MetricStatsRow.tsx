"use client";

import React from "react";
import {
  Users,
  Bed,
  UserCheck,
  AlertCircle,
  PoundSterling,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { AdminStatsDTO } from "@repo/schema";
import { Card, Text } from "@repo/ui/components/ui";

interface MetricStatsRowProps {
  stats?: AdminStatsDTO;
  isLoading?: boolean;
}

function formatCurrency(val?: number): string {
  if (val === undefined || val === null) return "£0";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(val);
}

export function MetricStatsRow({ stats, isLoading }: MetricStatsRowProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 w-full font-sans">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-[88px] rounded-2xl bg-slate-100 animate-pulse border border-slate-200/80"
          />
        ))}
      </div>
    );
  }

  const residentCount = stats?.totalResidents ?? 0;
  const activeResidents = stats?.activeResidents ?? stats?.totalResidents ?? 0;
  const staffOnDuty = stats?.staffOnDuty ?? stats?.activeStaff ?? 0;
  const occupancyRate = stats?.occupancyRate ?? 0;
  const occupiedBeds = stats?.occupiedBeds ?? 0;
  const openIncidents = stats?.openIncidents ?? 0;
  const totalBeds = stats?.totalBeds ?? 0;
  const monthlyRev = stats?.monthlyRevenue ?? stats?.totalRevenue ?? 0;
  const totalOutstanding = stats?.totalOutstanding ?? 0;

  const statCards = [
    {
      title: "Total Residents",
      value: residentCount.toString(),
      trend: `${activeResidents} active residents`,
      trendType: "up" as const,
      icon: Users,
      bgColor: "bg-slate-50",
      iconColor: "text-[#4A706A]",
      trendColor: "text-emerald-700",
    },
    {
      title: "Staff on Duty",
      value: staffOnDuty.toString(),
      trend: "on shift today",
      trendType: "up" as const,
      icon: UserCheck,
      bgColor: "bg-[#F7F2EF]",
      iconColor: "text-[#4A706A]",
      trendColor: "text-slate-800",
    },
    {
      title: "Occupancy Rate",
      value: `${occupancyRate}%`,
      trend: totalBeds > 0 ? `${occupiedBeds}/${totalBeds} beds occupied` : "No beds registered",
      trendType: "up" as const,
      icon: Bed,
      bgColor: "bg-[#FAF7EC]",
      iconColor: "text-[#4A706A]",
      trendColor: "text-emerald-700",
    },
    {
      title: "Open Incidents",
      value: openIncidents.toString(),
      trend: openIncidents > 0 ? "requires attention" : "all clear",
      trendType: openIncidents > 0 ? ("down" as const) : ("up" as const),
      icon: AlertCircle,
      bgColor: openIncidents > 0 ? "bg-red-50" : "bg-slate-50",
      iconColor: openIncidents > 0 ? "text-red-500" : "text-[#4A706A]",
      trendColor: openIncidents > 0 ? "text-red-600" : "text-emerald-700",
      fillIcon: openIncidents > 0,
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(monthlyRev),
      trend: totalOutstanding > 0 ? `${formatCurrency(totalOutstanding)} pending` : "all settled",
      trendType: "up" as const,
      icon: PoundSterling,
      bgColor: "bg-emerald-50/60",
      iconColor: "text-[#4A706A]",
      trendColor: "text-emerald-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 w-full font-sans">
      {statCards.map((stat, i) => {
        const Icon = stat.icon;
        const TrendIcon = stat.trendType === "up" ? ArrowUp : ArrowDown;

        return (
          <Card
            key={i}
            variant="ghost"
            className={`${stat.bgColor} p-5 rounded-2xl flex flex-row items-start gap-3.5 border border-slate-200/80 transition-all duration-200 hover:shadow-sm`}
          >
            {/* White Circular Icon Container */}
            <div className="size-9 bg-white rounded-full flex items-center justify-center shrink-0 shadow-xs border border-slate-100 mt-0.5">
              <Icon
                className={`size-4 ${stat.iconColor} ${stat.fillIcon ? "fill-red-500 text-white" : ""
                  }`}
              />
            </div>

            {/* Metric Content */}
            <div className="flex flex-col gap-1 min-w-0">
              <Text size={"md"} weight={"regular"} >
                {stat.title}
              </Text>

              <Text size={"md"} weight={"semibold"}>
                {stat.value}
              </Text>

              <div
                className={`flex items-center gap-1 t ${stat.trendColor}`}
              >
                <TrendIcon className="size-3 stroke-[2.5]" />
                <Text size={"md"} weight={"regular"} className={`text-${stat.trendColor}`}>{stat.trend}</Text>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}