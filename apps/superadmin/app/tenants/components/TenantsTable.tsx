"use client";

import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@repo/ui/components/ui";
import { Building2, ShieldAlert } from "lucide-react";
import type { Tenant } from "../../../lib/types/tenant";
import { TenantRowActions } from "./TenantRowActions";

interface TenantsTableProps {
  tenants: Tenant[];
  onCopyVerificationLink: (token: string) => void;
}

export function TenantsTable({
  tenants,
  onCopyVerificationLink,
}: TenantsTableProps) {
  return (
    <div className="bg-surface-card-grey rounded-2xl overflow-hidden shadow-none border-none">
      <Table>
        <TableHeader className="bg-slate-100/70 border-b border-slate-200/80">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="pl-6 h-12 text-2xs font-bold uppercase tracking-wider text-slate-500">Tenant Name</TableHead>
            <TableHead className="h-12 text-2xs font-bold uppercase tracking-wider text-slate-500">Infrastructure</TableHead>
            <TableHead className="h-12 text-2xs font-bold uppercase tracking-wider text-slate-500">Compliance</TableHead>
            <TableHead className="h-12 text-2xs font-bold uppercase tracking-wider text-slate-500">Status</TableHead>
            <TableHead className="h-12 text-2xs font-bold uppercase tracking-wider text-slate-500">Usage</TableHead>
            <TableHead className="text-right pr-6 h-12 text-2xs font-bold uppercase tracking-wider text-slate-500">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-48 text-center text-slate-500 font-medium"
              >
                No tenants found matching your search.
              </TableCell>
            </TableRow>
          ) : (
            tenants.map((tenant) => (
              <TableRow
                key={tenant.id}
                className="group transition-all bg-white hover:bg-slate-50/80 border-b border-slate-200/60 last:border-0"
              >
                <TableCell className="py-3 pl-6">
                  <div className="flex items-center gap-3">
                    <div className="size-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-800 shrink-0">
                      <Building2 className="size-4" />
                    </div>
                    <div>
                      <Text size="xs" weight="bold" className="text-slate-900">
                        {tenant.name}
                      </Text>
                      <Text size="xs" variant="subdued" className="uppercase tracking-wide mt-0.5 text-2xs">
                        {tenant.city || "Location Pending"}
                      </Text>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-2xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono font-medium">
                    {tenant.subdomain}.cantracare.com
                  </code>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="size-3.5 text-slate-400" />
                    <Text size="xs" weight="regular" className="text-slate-700">
                      {tenant.cqcNumber || "N/A"}
                    </Text>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    state={
                      tenant.status === "Active"
                        ? "success"
                        : tenant.status === "Pending"
                          ? "warning"
                          : "danger"
                    }
                    className="text-2xs font-bold px-2.5 py-0.5 rounded-full"
                  >
                    {tenant.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Text size="xs" weight="semibold">
                      {tenant._count?.residents || 0}{" "}
                      <span className="text-slate-400 font-normal">
                        Beds
                      </span>
                    </Text>
                    <div className="size-1 rounded-full bg-slate-300" />
                    <Text size="xs" weight="semibold">
                      {tenant._count?.users || 0}{" "}
                      <span className="text-slate-400 font-normal">
                        Users
                      </span>
                    </Text>
                  </div>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <TenantRowActions
                    tenant={tenant}
                    onCopyVerificationLink={onCopyVerificationLink}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
