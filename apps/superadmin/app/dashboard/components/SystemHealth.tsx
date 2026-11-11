import {
  Button,
  Text,
} from "@repo/ui/components/ui";
import { Activity, ArrowUpRight } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import type { SystemHealthMetric } from "./dashboard-data";

interface SystemHealthProps {
  metrics: SystemHealthMetric[];
}

export function SystemHealth({ metrics }: SystemHealthProps) {
  return (
    <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-6 shadow-none border-none">
      <div className="pb-4 border-b border-slate-200/80">
        <Text as="h3" size="md" weight="bold" className="flex items-center gap-2">
          <Activity className="size-4 text-emerald-800" />
          System Health
        </Text>
        <Text size="xs" weight="regular" variant="subdued">
          Real-time platform compute and latency
        </Text>
      </div>

      <div className="space-y-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 px-0.5">
              <span>{metric.label}</span>
              <span
                className={
                  metric.tone === "primary" ? "text-emerald-800 font-bold" : "text-slate-700 font-bold"
                }
              >
                {metric.value}%
              </span>
            </div>
            <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  metric.tone === "primary" ? "bg-emerald-800" : "bg-slate-600",
                )}
                style={{ width: `${metric.value}%` }}
              />
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-slate-200/80 space-y-3">
          <Text size="xs" variant="subdued" className="leading-relaxed">
            All platform nodes are scaling correctly. No major latency reported in the last 24 hours.
          </Text>
          <Button variant="outline" className="w-full flex items-center justify-center gap-2 text-xs">
            Infrastructure Diagnostics
            <ArrowUpRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
