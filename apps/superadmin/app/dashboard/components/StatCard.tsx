import {
  Badge,
  Text,
} from "@repo/ui/components/ui";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subValue: string;
  icon: LucideIcon;
  trend: number;
}

export function StatCard({
  title,
  value,
  subValue,
  icon: Icon,
  trend,
}: StatCardProps) {
  return (
    <div className="bg-surface-card-grey rounded-2xl p-6 space-y-3 transition-all hover:bg-slate-100/80 group">
      <div className="flex items-center justify-between">
        <Text as="h3" size="xs" weight="bold" variant="subdued" className="tracking-wide uppercase">
          {title}
        </Text>
        <div className="size-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-800 group-hover:scale-105 transition-transform">
          <Icon className="size-5" />
        </div>
      </div>
      <div>
        <Text as="div" size="xl" weight="bold" className="text-slate-900 tracking-tight">
          {value}
        </Text>
        <div className="flex items-center gap-2 mt-2">
          <Badge state={trend > 0 ? "success" : "danger"} className="text-2xs font-semibold px-2 py-0.5 rounded-full">
            {trend > 0 ? "+" : ""}
            {trend}%
          </Badge>
          <Text size="xs" variant="subdued">
            {subValue}
          </Text>
        </div>
      </div>
    </div>
  );
}
