"use client";

import {
  Button,
  Badge,
  Text,
} from "@repo/ui/components/ui";
import { Building2, Eye, Settings } from "lucide-react";
import type { Tenant } from "../../../lib/types/tenant";

interface TenantCardProps {
  tenant: Tenant;
}

export function TenantCard({ tenant }: TenantCardProps) {
  return (
    <div className="bg-surface-card-grey rounded-2xl p-6 space-y-6 shadow-none border-none group transition-all hover:bg-slate-100/80">
      <div className="flex flex-row items-center justify-between pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-800 shrink-0 group-hover:scale-105 transition-transform">
            <Building2 className="size-5" />
          </div>
          <div>
            <Text as="h3" size="sm" weight="bold" className="text-slate-900 leading-tight">
              {tenant.name}
            </Text>
            <Text size="xs" variant="subdued" className="font-mono mt-0.5 text-2xs">
              {tenant.subdomain}.cantracare.com
            </Text>
          </div>
        </div>
        <Badge
          state={tenant.status === "Active" ? "success" : "warning"}
          className="text-2xs font-bold px-2.5 py-0.5 rounded-full"
        >
          {tenant.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200/70">
        <div>
          <Text size="xs" variant="subdued" className="uppercase font-semibold tracking-wider block mb-1 text-2xs">
            Capacity
          </Text>
          <Text size="xs" weight="bold" className="text-slate-900">
            {tenant._count?.residents || 0}{" "}
            <span className="text-slate-400 font-normal">
              Residents
            </span>
          </Text>
        </div>
        <div>
          <Text size="xs" variant="subdued" className="uppercase font-semibold tracking-wider block mb-1 text-2xs">
            Staffing
          </Text>
          <Text size="xs" weight="bold" className="text-slate-900">
            {tenant._count?.users || 0}{" "}
            <span className="text-slate-400 font-normal">
              Employees
            </span>
          </Text>
        </div>
      </div>

      <div className="pt-2 flex items-center justify-between">
        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold">
          <Eye className="size-3.5" />
          View Details
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8 rounded-lg"
        >
          <Settings className="size-3.5 text-slate-600" />
        </Button>
      </div>
    </div>
  );
}
