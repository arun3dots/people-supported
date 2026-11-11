"use client";

import React from "react";
import {
  ClipboardCheck,
  AlertCircle,
  Clock,
  Activity,
  ArrowUp,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@repo/ui/components/ui";

interface CarerStatsGridProps {
  tasks: any[];
}

export function CarerStatsGrid({ tasks }: CarerStatsGridProps) {
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter((t) => t.status === "Completed").length || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const statItems = [
    {
      title: "Tasks Completed",
      value: `${completionRate}%`,
      subtitle: totalTasks > 0 ? `${completedTasks} of ${totalTasks} tasks done` : "No shift tasks",
      icon: ClipboardCheck,
      bgColor: "bg-slate-50",
      iconColor: "text-[#3D5C57]",
      badgeColor: "text-emerald-700 bg-emerald-50",
      badgeText: "On Schedule",
    },
    {
      title: "Active Alerts",
      value: "3",
      subtitle: "High priority reviews",
      icon: AlertCircle,
      bgColor: "bg-[#FAF7EC]",
      iconColor: "text-amber-600",
      badgeColor: "text-amber-700 bg-amber-50",
      badgeText: "Attention Needed",
    },
    {
      title: "Shift Time Rem.",
      value: "4h 12m",
      subtitle: "Day Shift (08:00 - 16:00)",
      icon: Clock,
      bgColor: "bg-[#F7F2EF]",
      iconColor: "text-indigo-600",
      badgeColor: "text-slate-700 bg-slate-100",
      badgeText: "Active Shift",
    },
    {
      title: "Vitals Recorded",
      value: "92",
      subtitle: "Observations logged today",
      icon: Activity,
      bgColor: "bg-emerald-50/60",
      iconColor: "text-[#3D5C57]",
      badgeColor: "text-emerald-700 bg-emerald-100/60",
      badgeText: "+12 vs yesterday",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full font-sans">
      {statItems.map((item, index) => {
        const Icon = item.icon;

        return (
          <Card
            key={index}
            className={`${item.bgColor} p-5 rounded-2xl border border-slate-200/80 transition-all duration-200 hover:shadow-xs hover:border-slate-300 flex flex-col justify-between gap-4`}
          >
            {/* Header: Title & Circular Icon */}
            <div className="flex items-start justify-between gap-3">
              <span className="text-md font-semibold text-slate-700 leading-tight">
                {item.title}
              </span>
              <div className="size-9 bg-white rounded-full flex items-center justify-center shrink-0 shadow-xs border border-slate-100">
                <Icon className={`size-4 ${item.iconColor}`} />
              </div>
            </div>

            {/* Metric Value */}
            <div>
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-none">
                {item.value}
              </span>
              <p className="text-md text-slate-500 font-medium mt-1 truncate">
                {item.subtitle}
              </p>
            </div>

            {/* Status / Badge Footer */}
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                {item.badgeText}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
