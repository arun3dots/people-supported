"use client";

import { Badge } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import type { RiskStatus, RiskLevel } from "@repo/schema";
import { getRiskLevelStyle, getStatusStyle } from "./risk-utils";

interface Props {
  status: RiskStatus;
  level: RiskLevel | null;
  inherentLevel: RiskLevel;
}

export function RiskWorkflowBadge({ status, level, inherentLevel }: Props) {
  const effectiveLevel = level ?? inherentLevel ?? "Low";
  const ls = getRiskLevelStyle(effectiveLevel);
  const ss = getStatusStyle(status);
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge className={cn(ss?.className || "bg-slate-200 text-slate-700", "text-sm font-medium px-2.5 py-0.5")}>
        {ss?.label || status || "Draft"}
      </Badge>
      <Badge className={cn(ls?.badge || "bg-emerald-600 text-white", "text-sm font-medium px-2.5 py-0.5")}>
        {effectiveLevel} risk
        {level && level !== inherentLevel ? " (residual)" : ""}
      </Badge>
    </div>
  );
}
