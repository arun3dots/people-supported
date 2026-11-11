"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { Card, CardTitle } from "@repo/ui/components/ui/Card";

export interface DistributionItem {
  label: string;
  value: string;
  rawCount?: number;
  color: string;
}

interface QuickAction {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
}

interface FacilityDistributionCardProps {
  title: string;
  totalLabel: string;
  totalCount: number;
  items: DistributionItem[];
  quickActions: QuickAction[];
}

function parseColor(colorStr: string): string {
  if (colorStr.startsWith("#") || colorStr.startsWith("rgb")) return colorStr;
  const hexMatch = colorStr.match(/bg-\[([#a-fA-F0-9]+)\]/);
  if (hexMatch) return hexMatch[1] ?? "#0f766e";

  const colorMap: Record<string, string> = {
    "bg-blue-500": "#0284c7",
    "bg-gray-300": "#94a3b8",
    "bg-[#4A706A]": "#0f766e",
    "bg-[#D4A843]": "#d97706",
  };

  return colorMap[colorStr] || "#0f766e";
}

export function FacilityDistributionCard({
  title,
  totalLabel,
  totalCount,
  items,
  quickActions,
}: FacilityDistributionCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  const total =
    items.reduce((acc, item) => {
      if (item.rawCount !== undefined) return acc + item.rawCount;
      const match = item.value.match(/^(\d+)/);
      return acc + (match?.[1] ? parseInt(match[1], 10) : 0);
    }, 0) || totalCount || 1;

  let cumulativePercent = 0;
  const segments = items.map((item) => {
    const count =
      item.rawCount !== undefined
        ? item.rawCount
        : parseInt(item.value.match(/^(\d+)/)?.[1] || "0", 10);
    const percent = count / total;

    const strokeDasharray = `${percent * circumference} ${(1 - percent) * circumference}`;
    const targetOffset = -cumulativePercent * circumference;
    cumulativePercent += percent;

    return {
      ...item,
      parsedColor: parseColor(item.color),
      strokeDasharray,
      targetOffset,
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full font-['Outfit',sans-serif]">
      {/* Distribution Chart Card */}
      <Card className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between min-h-[210px] w-full shadow-xs">
        <CardTitle className="text-base font-semibold text-slate-900">
          {title}
        </CardTitle>

        {/* Dynamic Fluid Content Wrapper */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-10 my-auto w-full">
          {/* Donut Chart Container */}
          <div className="relative size-32 shrink-0">
            <svg
              viewBox="0 0 120 120"
              className="size-32 -rotate-90 transform"
            >
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="16"
              />
              {segments.map((seg, idx) => (
                <circle
                  key={idx}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="transparent"
                  stroke={seg.parsedColor}
                  strokeWidth="16"
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={isLoaded ? seg.targetOffset : circumference}
                  style={{
                    transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              ))}
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="font-bold text-2xl text-slate-900 leading-none">
                {totalCount}
              </span>
              <span className="text-md font-medium text-slate-500 mt-1">
                {totalLabel}
              </span>
            </div>
          </div>

          {/* Legend Section */}
          <div className="w-full flex-1 space-y-3">
            {segments.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between text-md w-full"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.parsedColor }}
                  />
                  <span className="text-md text-slate-700 font-medium">
                    {item.label}
                  </span>
                </div>
                <span className="text-md text-slate-500 font-normal text-right">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Quick Actions Card */}
      <Card className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between min-h-[210px] w-full shadow-xs">
        <CardTitle className="text-base font-semibold text-slate-900">
          Quick Actions
        </CardTitle>

        {/* Responsive Grid with equal column distributions */}
        <div className="grid grid-cols-4 gap-2 w-full my-auto justify-items-center items-center">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              className="flex flex-col items-center justify-start gap-2 cursor-pointer border-0 bg-transparent p-0 outline-none group shrink-0"
            >
              <div className="size-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs shrink-0">
                {action.icon}
              </div>

              <div className="flex flex-col items-center justify-center w-full">
                <span className="text-md font-medium text-slate-700 text-center whitespace-nowrap">
                  {action.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}