"use client";

import React, { useMemo } from "react";
import { Text } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import type { SchemeItem } from "../../../../../../../../lib/types/facility";
import type { TableColumn } from "../../../../../../../../lib/components/shared/tableColumns";
import { RowActions } from "../../../../../../../../lib/components/shared";

interface UseSchemeColumnsOptions {
  onEdit: (scheme: SchemeItem) => void;
  onDelete: (id: string) => void;
}

export function useSchemeColumns({
  onEdit,
  onDelete,
}: UseSchemeColumnsOptions): TableColumn<SchemeItem>[] {
  return useMemo<TableColumn<SchemeItem>[]>(
    () => [
      { kind: "index", id: "index", header: "#" },
      {
        id: "schemeDetails",
        accessorKey: "name",
        header: "Scheme & Reference",
        enableSorting: false,
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-emerald-800 text-md shrink-0">
                {s.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <Text size="sm" weight="bold" className="text-slate-900 truncate">
                  {s.name}
                </Text>
                <span className="text-md text-slate-500 truncate">
                  Ref: {s.referenceId || s.id.slice(0, 8)} ·{" "}
                  {s.housingPartner || "Registered Housing Partner"}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        id: "locationLa",
        header: "Location & Commissioning LA",
        enableSorting: false,
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-slate-900 truncate">
                {s.location || "Regional Scheme"}
              </span>
              <span className="text-md text-slate-500 truncate">
                {s.commissioningLa || "Local Authority Commissioned"}
              </span>
            </div>
          );
        },
      },
      {
        id: "schemeManager",
        header: "Scheme Manager",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm font-medium text-slate-800">
            {row.original.schemeManagerName || "Assigned Manager"}
          </span>
        ),
      },
      {
        id: "commissionedHours",
        header: "Commissioned Hours",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm font-bold text-slate-800">
            {row.original.commissionedHours
              ? `${row.original.commissionedHours} hrs/wk`
              : "—"}
          </span>
        ),
      },
      {
        id: "propertiesCount",
        header: "Properties",
        enableSorting: false,
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900">
                {s.totalProperties} properties
              </span>
              <span className="text-md text-slate-500">
                {s.totalRooms} rooms · {s.totalBeds} beds
              </span>
            </div>
          );
        },
      },
      {
        id: "occupancy",
        header: "Scheme Occupancy",
        enableSorting: false,
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="w-32 space-y-1">
              <div className="flex items-center justify-between text-md">
                <span className="font-bold text-slate-900">
                  {s.occupiedBeds}/{s.totalBeds}
                </span>
                <span className="text-slate-500">{s.occupancyRate}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-800"
                  style={{ width: `${Math.min(100, s.occupancyRate)}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => {
          const s = row.original;
          return (
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-1 rounded-full text-md font-semibold",
                s.status === "Active"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-slate-100 text-slate-600 border border-slate-200",
              )}
            >
              {s.status || "Active"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="flex justify-center">
              <RowActions
                onEdit={() => onEdit(s)}
                editLabel={`Edit ${s.name}`}
                onDelete={() => onDelete(s.id)}
                deleteLabel={`Delete ${s.name}`}
              />
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete],
  );
}
