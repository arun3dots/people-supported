"use client";

import React, { useMemo } from "react";
import { Badge, Text } from "@repo/ui/components/ui";
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
              <div className="size-10 rounded-full bg-surface-primary-light flex items-center justify-center font-medium text-primary text-md shrink-0">
                {s.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <Text size="md" weight="medium" className="text-slate-900 truncate">
                  {s.name}
                </Text>
                <Text size="md" variant="muted" className="truncate">
                  Ref: {s.referenceId || s.id.slice(0, 8)} ·{" "}
                  {s.housingPartner || "Registered Housing Partner"}
                </Text>
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
              <Text size="md" weight="medium" className="text-slate-900 truncate">
                {s.location || "Regional Scheme"}
              </Text>
              <Text size="md" variant="muted" className="truncate">
                {s.commissioningLa || "Local Authority Commissioned"}
              </Text>
            </div>
          );
        },
      },
      {
        id: "schemeManager",
        header: "Scheme Manager",
        enableSorting: false,
        cell: ({ row }) => (
          <Text size="md" weight="normal" className="text-slate-800">
            {row.original.schemeManagerName || "Assigned Manager"}
          </Text>
        ),
      },
      {
        id: "commissionedHours",
        header: "Commissioned Hours",
        enableSorting: false,
        cell: ({ row }) => (
          <Text size="md" weight="medium" className="text-slate-800">
            {row.original.commissionedHours
              ? `${row.original.commissionedHours} hrs/wk`
              : "—"}
          </Text>
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
              <Text size="md" weight="medium" className="text-slate-900">
                {s.totalProperties} properties
              </Text>
              <Text size="md" variant="muted">
                {s.totalRooms} rooms · {s.totalBeds} beds
              </Text>
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
              <div className="flex items-center justify-between">
                <Text size="md" weight="medium" className="text-slate-900">
                  {s.occupiedBeds}/{s.totalBeds}
                </Text>
                <Text size="md" variant="muted">
                  {s.occupancyRate}%
                </Text>
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
            <Badge
              variant="secondary"
              state={s.status === "Active" ? "success" : "inactive"}
              className="border"
            >
              {s.status || "Active"}
            </Badge>
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
