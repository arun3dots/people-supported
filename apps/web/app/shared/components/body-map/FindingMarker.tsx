"use client";

import React from "react";
import { cn } from "@repo/ui/lib/utils";

export interface FindingMarkerItem {
  id: string;
  trackingId: string;
  anatomyId: string;
  view: string;
  bodyMapAssetVersion?: string;
  findingType: string;
  severity: string;
  status: string;
  locationLabel: string;
  exactCoordinateSpace?: string;
  exactX?: number | null;
  exactY?: number | null;
}

interface FindingMarkerProps {
  findings: FindingMarkerItem[];
  isSelected?: boolean;
  onClick: (findings: FindingMarkerItem[]) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function FindingMarker({
  findings,
  isSelected = false,
  onClick,
  className = "",
  style = {},
}: FindingMarkerProps) {
  if (findings.length === 0) return null;

  const count = findings.length;
  const hasOpen = findings.some((f) => f.status === "Open");
  const primarySeverity = findings[0]?.severity;

  // Severity color tokens
  let bgColor = "bg-emerald-500";
  if (primarySeverity === "Severe") bgColor = "bg-red-600";
  else if (primarySeverity === "Moderate") bgColor = "bg-amber-500";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(findings);
      }}
      className={cn(
        "absolute -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center rounded-full border-2 border-white shadow-md transition-all hover:scale-125 focus:outline-none focus:ring-2 focus:ring-blue-500",
        bgColor,
        count > 1 ? "size-6" : "size-4",
        isSelected && "ring-4 ring-blue-400 scale-125 z-20",
        hasOpen && "animate-pulse",
        className,
      )}
      style={style}
      aria-label={`${count} findings: ${findings.map((f) => f.trackingId).join(", ")}`}
    >
      {count > 1 ? (
        <span className="text-[10px] font-extrabold text-white leading-none select-none">
          {count}
        </span>
      ) : (
        <span className="size-1.5 rounded-full bg-white block" />
      )}
    </button>
  );
}
