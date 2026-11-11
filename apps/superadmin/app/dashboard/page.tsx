import { Plus } from "lucide-react";
import { Button, Text } from "@repo/ui/components/ui";
import Link from "next/link";

import { StatCard } from "./components/StatCard";
import { RecentOnboarding } from "./components/RecentOnboarding";
import { SystemHealth } from "./components/SystemHealth";
import {
  DASHBOARD_STATS,
  RECENT_ONBOARDING,
  SYSTEM_HEALTH,
} from "./components/dashboard-data";

export default function DashboardPage() {
  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <Text as="h1" size="xl" weight="bold" className="text-slate-900 tracking-tight">
            Platform Overview
          </Text>
          <Text size="xs" weight="regular" variant="subdued" className="mt-1">
            Monitoring global SaaS infrastructure and tenant health.
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/tenants/create">
            <Button variant="primary" className="flex items-center gap-2">
              <Plus className="size-4" />
              Onboard New Tenant
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {DASHBOARD_STATS.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Activity + health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentOnboarding entries={RECENT_ONBOARDING} />
        <SystemHealth metrics={SYSTEM_HEALTH} />
      </div>
    </div>
  );
}
