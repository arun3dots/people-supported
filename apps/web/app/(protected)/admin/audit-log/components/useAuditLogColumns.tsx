"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Text } from "@repo/ui/components/ui";
import type { AuditLog as AuditLogItem } from "../../../../../lib/queries/audit/useGetAuditLogsQuery";
import type { TableColumn } from "../../../../../lib/components/shared/tableColumns";
import {
  formatLogWhen,
  getLogArea,
  getLogChange,
  getLogBeforeLines,
  getLogAfterLines,
  getLogResident,
  getLogResidentId,
  getActivityBadgeState,
  getActivityBadgeLabel,
} from "./audit-helpers";

export { getActivityBadgeState, getActivityBadgeLabel };

export function useAuditLogColumns(): TableColumn<AuditLogItem>[] {
  return useMemo<TableColumn<AuditLogItem>[]>(
    () => [
      {
        kind: "index",
        id: "index",
        header: "#",
      },
      {
        id: "when",
        header: "When",
        enableSorting: false,
        cell: ({ row }) => {
          const { date, time } = formatLogWhen(row.original.timestamp);
          return (
            <div className="flex flex-col leading-tight py-1">
              <Text size="sm" weight="medium" className="text-slate-800">
                {date}
              </Text>
              <Text size="sm" weight="regular" className="text-slate-500">
                {time}
              </Text>
            </div>
          );
        },
      },
      {
        id: "who",
        header: "Who",
        enableSorting: false,
        cell: ({ row }) => {
          const log = row.original;
          const name = log.user?.fullName || log.userFullName || "System";
          const role = log.userRoleName || "Staff";
          return (
            <div className="flex flex-col leading-tight py-1">
              <Text size="sm" weight="bold" className="text-slate-900">
                {name}
              </Text>
              <Text size="sm" weight="regular" className="text-slate-500">
                {role}
              </Text>
            </div>
          );
        },
      },
      {
        id: "resident",
        header: "Resident",
        enableSorting: false,
        cell: ({ row }) => {
          const resident = getLogResident(row.original);
          const residentId = getLogResidentId(row.original);

          if (resident !== "—" && residentId) {
            return (
              <Link
                href={`/admin/residents/${residentId}?tab=careplan`}
                className="text-sm font-semibold text-emerald-800 hover:text-emerald-950 hover:underline transition-colors block py-1"
                title={`View ${resident}'s care plan`}
              >
                {resident}
              </Link>
            );
          }

          return (
            <Text size="sm" weight="regular" className="text-slate-800 py-1">
              {resident}
            </Text>
          );
        },
      },
      {
        id: "area",
        header: "Area",
        enableSorting: false,
        cell: ({ row }) => {
          const area = getLogArea(row.original);
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-slate-100 text-slate-700 border border-slate-200/80">
              {area}
            </span>
          );
        },
      },
      {
        id: "change",
        header: "Change",
        enableSorting: false,
        cell: ({ row }) => {
          const change = getLogChange(row.original);
          return (
            <div className="max-w-md py-1 min-w-0">
              <Text size="sm" weight="regular" className="text-slate-800 leading-snug break-words break-all [overflow-wrap:anywhere]">
                {change}
              </Text>
            </div>
          );
        },
      },
      {
        id: "before",
        header: "Before",
        enableSorting: false,
        cell: ({ row }) => {
          const lines = getLogBeforeLines(row.original);
          return (
            <div className="flex flex-col gap-0.5 py-1 max-w-xs text-sm text-slate-600 leading-relaxed min-w-0">
              {lines.map((line, idx) => (
                <span key={idx} className="block break-words break-all [overflow-wrap:anywhere]">
                  {line}
                </span>
              ))}
            </div>
          );
        },
      },
      {
        id: "after",
        header: "After",
        enableSorting: false,
        cell: ({ row }) => {
          const lines = getLogAfterLines(row.original);
          return (
            <div className="flex flex-col gap-0.5 py-1 max-w-xs text-sm text-slate-800 font-medium leading-relaxed min-w-0">
              {lines.map((line, idx) => (
                <span key={idx} className="block break-words break-all [overflow-wrap:anywhere]">
                  {line}
                </span>
              ))}
            </div>
          );
        },
      },
    ],
    [],
  );
}
