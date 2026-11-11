"use client";

import { ShieldAlert, ClipboardCheck, Clock, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from "@repo/ui/components/ui";
import { useGetRiskOverviewQuery } from "../../../../../lib/queries/risk";

const LEVEL_ORDER = ["Extreme", "High", "Moderate", "Low"] as const;

function levelClass(level: string): string {
  switch (level) {
    case "Extreme":
      return "bg-red-700 text-white";
    case "High":
      return "bg-red-500 text-white";
    case "Moderate":
      return "bg-orange-400 text-white";
    case "Low":
      return "bg-emerald-400 text-white";
    default:
      return "bg-slate-300 text-slate-700";
  }
}

export function RiskOverviewCard() {
  const { data, isLoading } = useGetRiskOverviewQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-500" /> Risk overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading || !data ? (
          <p className="text-md text-muted-foreground">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 text-center">
              <Stat
                icon={<ClipboardCheck className="w-4 h-4" />}
                label="Pending review"
                value={data.pendingReview}
              />
              <Stat
                icon={<Clock className="w-4 h-4" />}
                label="Reviews due (7d)"
                value={data.reviewsDueIn7Days}
              />
              <Stat
                icon={<AlertTriangle className="w-4 h-4" />}
                label="High-risk active"
                value={data.highRiskActive}
              />
            </div>

            <div>
              <p className="text-md  tracking-wide text-muted-foreground mb-2">
                By level
              </p>
              <div className="flex flex-wrap gap-2">
                {LEVEL_ORDER.map((lvl) => {
                  const entry = data.byLevel.find((b) => b.level === lvl);
                  if (!entry) return null;
                  return (
                    <Badge key={lvl} className={levelClass(lvl)}>
                      {lvl}: {entry.count}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {data.byCategory.length > 0 && (
              <div>
                <p className="text-md  tracking-wide text-muted-foreground mb-2">
                  By category
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.byCategory.map((c) => (
                    <Badge key={c.category} variant="outline">
                      {c.category}: {c.count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-center gap-1 text-muted-foreground text-md">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
