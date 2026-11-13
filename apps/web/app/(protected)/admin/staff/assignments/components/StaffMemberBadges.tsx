"use client";

import React from "react";
import { Text } from "@repo/ui/components/ui";

export function CompetencyBadge({
  percent,
  label,
}: {
  percent: number;
  label: string;
}) {
  let colorClass = "stroke-emerald-600 text-emerald-600";
  let labelColor = "text-emerald-700";
  if (percent <= 35) {
    colorClass = "stroke-red-500 text-red-500";
    labelColor = "text-red-600";
  } else if (percent <= 70) {
    colorClass = "stroke-amber-500 text-amber-500";
    labelColor = "text-amber-700";
  }

  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative size-9 flex items-center justify-center shrink-0">
        <svg className="size-full -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r={radius}
            className="stroke-slate-200/80"
            strokeWidth="3.5"
            fill="transparent"
          />
          <circle
            cx="18"
            cy="18"
            r={radius}
            className={`${colorClass} transition-all duration-500`}
            strokeWidth="3.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-md font-bold text-slate-800">
          {percent}%
        </span>
      </div>
      <Text size="md" weight="medium" className={labelColor}>
        {label}
      </Text>
    </div>
  );
}

export function ComplianceBadge({ percent }: { percent: number }) {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative size-9 flex items-center justify-center shrink-0">
      <svg className="size-full -rotate-90" viewBox="0 0 36 36">
        <circle
          cx="18"
          cy="18"
          r={radius}
          className="stroke-slate-200/80"
          strokeWidth="3.5"
          fill="transparent"
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          className="stroke-emerald-800 transition-all duration-500"
          strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-md font-bold text-slate-800">
        {percent}%
      </span>
    </div>
  );
}

