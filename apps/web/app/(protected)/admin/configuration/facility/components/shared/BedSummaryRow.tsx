"use client";

import { useState, useEffect } from "react";
import { Clock, Utensils, FileText, Wrench } from "lucide-react";
import { Card, Text } from "@repo/ui/components/ui";

interface BedSummaryRowProps {
  totalBeds?: number;
  occupiedBeds?: number;
  availableBeds?: number;
  reservedBeds?: number;
  maintenanceBeds?: number;
}

export function BedSummaryRow({
  totalBeds = 103,
  occupiedBeds = 89,
  availableBeds = 9,
  reservedBeds = 3,
  maintenanceBeds = 2,
}: BedSummaryRowProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const total = totalBeds || 1;

  // Percentage calculations
  const occPct = ((occupiedBeds / total) * 100).toFixed(1);
  const availPct = ((availableBeds / total) * 100).toFixed(1);
  const resPct = ((reservedBeds / total) * 100).toFixed(1);
  const maintPct = ((maintenanceBeds / total) * 100).toFixed(1);

  // SVG Arc calculations
  const radius = 32;
  const circumference = 2 * Math.PI * radius; // ~201.06

  const occDash = (occupiedBeds / total) * circumference;
  const availDash = (availableBeds / total) * circumference;
  const resDash = (reservedBeds / total) * circumference;
  const maintDash = (maintenanceBeds / total) * circumference;

  const occOffset = 0;
  const availOffset = -occDash;
  const resOffset = -(occDash + availDash);
  const maintOffset = -(occDash + availDash + resDash);

  const legendItems = [
    { color: "bg-sky-600", stroke: "#0284c7", label: "Occupied", value: `${occupiedBeds} (${occPct}%)` },
    { color: "bg-emerald-600", stroke: "#059669", label: "Available", value: `${availableBeds} (${availPct}%)` },
    { color: "bg-amber-500", stroke: "#d97706", label: "Reserved", value: `${reservedBeds} (${resPct}%)` },
    { color: "bg-orange-500", stroke: "#ea580c", label: "Maintenance", value: `${maintenanceBeds} (${maintPct}%)` },
  ];

  const metrics = [
    {
      title: "Avg Stay Duration",
      value: "28",
      unit: "Days",
      subtitle: "Across occupied beds",
      icon: <Clock className="size-4 text-slate-700" />,
    },
    {
      title: "Upcoming Discharges",
      value: "07",
      unit: "Planned",
      subtitle: "Next 7 days",
      icon: <Utensils className="size-4 text-slate-700" />,
    },
    {
      title: "Pending Admissions",
      value: "05",
      unit: "Queued",
      subtitle: "Awaiting bed",
      icon: <FileText className="size-4 text-slate-700" />,
    },
    {
      title: "Maintenance Due",
      value: "02",
      unit: "Beds",
      subtitle: "Service required",
      icon: <Wrench className="size-4 text-slate-700" />,
    },
  ];

  return (
    <Card
      variant="surface"
      className="w-full p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-0 items-stretch min-h-[160px]"
    >
      {/* Column 1: Bed Status Summary */}
      <div className="w-full flex flex-col items-start gap-2.5 p-0 select-none pb-4 sm:pb-0 border-b sm:border-b-0 sm:border-r border-slate-200 pr-0 sm:pr-4">
        <Text as="h3" size="md" weight="semibold" className="text-slate-900">
          Bed Status Summary
        </Text>

        {/* Inner Content Layout */}
        <div className="w-full flex flex-row items-center gap-3 flex-1">
          {/* Donut Container */}
          <div className="relative size-20 shrink-0">
            <svg className="size-20 -rotate-90 transform" viewBox="0 0 80 80">
              {/* Occupied Segment */}
              <circle
                cx="40"
                cy="40"
                r={radius}
                fill="transparent"
                stroke={legendItems[0]?.stroke || "#0284c7"}
                strokeWidth="10"
                strokeDasharray={`${occDash} ${circumference}`}
                strokeDashoffset={isLoaded ? occOffset : circumference}
                style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }}
              />
              {/* Available Segment */}
              <circle
                cx="40"
                cy="40"
                r={radius}
                fill="transparent"
                stroke={legendItems[1]?.stroke || "#059669"}
                strokeWidth="10"
                strokeDasharray={`${availDash} ${circumference}`}
                strokeDashoffset={isLoaded ? availOffset : circumference}
                style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }}
              />
              {/* Reserved Segment */}
              <circle
                cx="40"
                cy="40"
                r={radius}
                fill="transparent"
                stroke={legendItems[2]?.stroke || "#d97706"}
                strokeWidth="10"
                strokeDasharray={`${resDash} ${circumference}`}
                strokeDashoffset={isLoaded ? resOffset : circumference}
                style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }}
              />
              {/* Maintenance Segment */}
              <circle
                cx="40"
                cy="40"
                r={radius}
                fill="transparent"
                stroke={legendItems[3]?.stroke || "#ea580c"}
                strokeWidth="10"
                strokeDasharray={`${maintDash} ${circumference}`}
                strokeDashoffset={isLoaded ? maintOffset : circumference}
                style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }}
              />
            </svg>
          </div>

          {/* Legend Column */}
          <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
            {legendItems.map((item, idx) => (
              <div key={idx} className="w-full flex flex-row items-center justify-between gap-1 text-md">
                <div className="flex flex-row items-center gap-1.5 min-w-0">
                  <span className={`size-2 rounded-xs ${item.color} shrink-0`} />
                  <span className="font-medium text-slate-700 truncate">
                    {item.label}
                  </span>
                </div>
                <span className="text-slate-500 font-normal text-right shrink-0">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Columns 2-5: Key Metric Cards */}
      {metrics.map((metric, idx) => (
        <div
          key={idx}
          className={`flex flex-col justify-between select-none ${idx < metrics.length - 1
            ? "border-b sm:border-b-0 sm:border-r border-slate-200 pb-4 sm:pb-0 px-0 sm:px-4"
            : "pl-0 sm:pl-4"
            }`}
        >
          {/* Header Row: Title & Icon */}
          <div className="flex flex-row items-center justify-between gap-1 w-full">
            <span className="font-medium text-md text-slate-600 truncate">
              {metric.title}
            </span>
            <div className="size-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
              {metric.icon}
            </div>
          </div>

          {/* Value Row */}
          <div className="flex items-baseline gap-1.5 my-2">
            <Text size="xl" weight="semibold" className="text-slate-900">
              {metric.value}
            </Text>
            <Text size="md" variant="muted">
              {metric.unit}
            </Text>
          </div>

          {/* Subtitle Footer */}
          <Text size="sm" variant="muted">
            {metric.subtitle}
          </Text>
        </div>
      ))}
    </Card>
  );
}