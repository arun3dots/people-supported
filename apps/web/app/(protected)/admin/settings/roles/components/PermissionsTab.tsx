"use client";

import React from "react";
import { Info } from "lucide-react";
import { useGetRolesListQuery } from "../../../../../../lib/queries/role/useGetRolesListQuery";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Card,
  Skeleton,
  Text,
} from "@repo/ui/components/ui";

const MODULE_LIST = [
  { id: "dashboard", label: "Dashboard", desc: "Main metrics & summary widgets" },
  { id: "residents", label: "Residents Directory", desc: "Resident care records, profiles & care plans" },
  { id: "staff", label: "Staff Management", desc: "Staff directory, rotas, leave requests & assignments" },
  { id: "facilities", label: "Facility Setup", desc: "Unit, wing, room & bed configurations" },
  { id: "payments", label: "Payments & Billing", desc: "Invoices, funding details & expense claims" },
  { id: "settings", label: "System Settings", desc: "Organisation settings, security & user access" },
  { id: "riskAssessments", label: "Risk Assessments", desc: "Resident risk evaluations, approvals & templates" },
];

export function PermissionsTab() {
  const { data: roles, isLoading, isError } = useGetRolesListQuery();

  if (isLoading) {
    return (
      <div className="space-y-4 font-sans">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500 font-medium font-sans">
        Error loading permissions matrix. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Intro Header Card */}
      <Card
        variant="surface"
        className="p-5 flex items-start gap-4 shadow-none bg-surface-card-grey border-none rounded-2xl"
      >
        <div className="size-10 rounded-full bg-surface-primary-light text-icon-primary flex items-center justify-center shrink-0">
          <Info className="size-5 text-icon-primary" />
        </div>
        <div>
          <Text as="h4" size="sm" weight="semibold" className="text-slate-900">
            Permissions Audit Matrix
          </Text>
          <Text size="sm" weight="regular" className="text-slate-500 mt-0.5 leading-relaxed">
            This matrix summarises active read (R), write (W), and delete (D) access rights granted to each role across system modules. Click on any role in the Roles tab to modify permissions.
          </Text>
        </div>
      </Card>

      {/* Permission Matrix Table */}
      <div className="bg-surface-card-grey rounded-2xl p-5 lg:p-6 flex flex-col justify-between overflow-x-auto shadow-none border-none">
        <Table className="w-full border-collapse">
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap min-w-52">Module Name</TableHead>
              {roles?.map((r) => (
                <TableHead key={r.id} className="whitespace-nowrap text-center">
                  <Text size="sm" weight="medium" className="text-slate-900">
                    {r.name}
                  </Text>
                  <Text size="sm" weight="regular" className="text-slate-400 mt-0.5">
                    {r.isSystem ? "System Role" : "Custom Role"}
                  </Text>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {MODULE_LIST.map((mod) => (
              <TableRow key={mod.id} className="hover:bg-slate-50/70 transition-colors">
                <TableCell className="py-4">
                  <Text size="sm" weight="medium" className="text-slate-900">
                    {mod.label}
                  </Text>
                  <Text size="sm" weight="regular" className="text-slate-500">
                    {mod.desc}
                  </Text>
                </TableCell>

                {roles?.map((role) => {
                  const rolePerms = role.permissions as Record<string, { read?: boolean; write?: boolean; delete?: boolean }> | undefined;
                  const p = rolePerms?.[mod.id] || {
                    read: false,
                    write: false,
                    delete: false,
                  };
                  const hasFullAccess = p.read && p.write && p.delete;
                  const hasAny = p.read || p.write || p.delete;

                  return (
                    <TableCell key={role.id} className="text-center">
                      {hasFullAccess ? (
                        <Badge variant="secondary" state="success" className="px-2 py-0.5 shadow-none">
                          Full Access
                        </Badge>
                      ) : hasAny ? (
                        <div className="inline-flex items-center gap-1 font-mono text-sm font-bold bg-white border border-slate-200/80 px-2 py-0.5 rounded text-slate-700">
                          <span className={p.read ? "text-emerald-700" : "text-slate-300"}>R</span>
                          <span className="text-slate-300">|</span>
                          <span className={p.write ? "text-blue-700" : "text-slate-300"}>W</span>
                          <span className="text-slate-300">|</span>
                          <span className={p.delete ? "text-red-600" : "text-slate-300"}>D</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-md font-semibold">— No Access —</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
