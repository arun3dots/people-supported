import {
  Button,
  Badge,
  Text,
} from "@repo/ui/components/ui";
import { Building2, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@repo/ui/lib/utils";
import type { OnboardingEntry } from "./dashboard-data";

interface RecentOnboardingProps {
  entries: OnboardingEntry[];
}

export function RecentOnboarding({ entries }: RecentOnboardingProps) {
  return (
    <div className="lg:col-span-2 bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-6 shadow-none border-none">
      <div className="flex flex-row items-center justify-between pb-4 border-b border-slate-200/80">
        <div>
          <Text as="h3" size="md" weight="bold">
            Recent Tenant Onboarding
          </Text>
          <Text size="xs" weight="regular" variant="subdued">
            Latest provisioned care home instances and status
          </Text>
        </div>
        <Link href="/tenants">
          <Button
            variant="ghost"
            size="sm"
            className="text-emerald-800 font-semibold gap-1 text-xs"
          >
            View All <ArrowUpRight className="size-3.5" />
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {entries.map((tenant) => (
          <div
            key={tenant.name}
            className={cn(
              "flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200/70 hover:border-slate-300 transition-all shadow-xs",
              tenant.status === "Pending" && "opacity-75",
            )}
          >
            <div className="flex items-center gap-3.5">
              <div className="size-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-800 shrink-0">
                <Building2 className="size-5" />
              </div>
              <div>
                <Text as="h4" size="xs" weight="bold">
                  {tenant.name}
                </Text>
                <Text size="xs" variant="subdued" className="mt-0.5">
                  {tenant.email}
                </Text>
              </div>
            </div>
            <div className="text-right flex items-center gap-4">
              <div className="hidden sm:block">
                <Text size="xs" variant="subdued" className="uppercase font-semibold tracking-wider block mb-0.5 text-2xs">
                  Onboarded
                </Text>
                <Text size="xs" weight="semibold">
                  {tenant.date}
                </Text>
              </div>
              <Badge
                state={tenant.status === "Active" ? "success" : "warning"}
                className="text-2xs font-bold px-2.5 py-0.5 rounded-full"
              >
                {tenant.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
