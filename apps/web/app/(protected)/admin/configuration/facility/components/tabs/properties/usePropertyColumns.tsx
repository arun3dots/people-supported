"use client";

import React, { useMemo } from "react";
import { Eye, CheckCircle2, AlertTriangle } from "lucide-react";
import { Badge, Text } from "@repo/ui/components/ui";
import type { PropertyItem } from "../../../../../../../../lib/types/facility";
import { RowActions } from "../../../../../../../../lib/components/shared/RowActions";
import type { TableColumn } from "../../../../../../../../lib/components/shared/tableColumns";
import {
  getPropertyManagerLabel,
  getPropertyPartnerLabel,
  getPropertySchemeLabel,
} from "./propertyDisplay";

interface UsePropertyColumnsProps {
  onSelectProperty: (property: PropertyItem) => void;
  onEdit: (property: PropertyItem) => void;
  onDelete: (id: string) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function usePropertyColumns({
  onSelectProperty,
  onEdit,
  onDelete,
}: UsePropertyColumnsProps): TableColumn<PropertyItem>[] {
  return useMemo<TableColumn<PropertyItem>[]>(
    () => [
      {
        kind: "index",
        id: "index",
        header: "#",
      },
      {
        id: "propertyAddress",
        accessorKey: "name",
        header: "Property & Address",
        enableSorting: false,
        cell: ({ row }) => {
          const p = row.original;
          const pd = p.parsedPropertyDetails ?? {};
          const addr = [pd.streetAddress, pd.postcode].filter(Boolean).join(", ");
          const refId = pd.referenceId || p.code || p.id.slice(0, 8);
          return (
            <button
              type="button"
              onClick={() => onSelectProperty(p)}
              className="flex items-center gap-3 text-left group cursor-pointer"
            >
              <div className="size-10 rounded-full bg-surface-primary-light flex items-center justify-center font-medium text-primary text-md shrink-0">
                {getInitials(p.name)}
              </div>
              <div className="flex flex-col min-w-0">
                <Text
                  size="md"
                  weight="medium"
                  className="text-slate-900 group-hover:text-primary transition-colors truncate"
                >
                  {p.name}
                </Text>
                <Text size="md" variant="muted" className="truncate max-w-[230px]">
                  {addr || p.description || "Supported Living Home"} · ID: {refId}
                </Text>
              </div>
            </button>
          );
        },
      },
      {
        id: "schemePartner",
        header: "Scheme & Housing Partner",
        enableSorting: false,
        cell: ({ row }) => {
          const p = row.original;
          const pd = p.parsedPropertyDetails ?? {};
          const schemeName = getPropertySchemeLabel(p);
          const partner = getPropertyPartnerLabel(p);
          const unitType =
            pd.unitConfiguration || pd.propertyType || "Self-contained flats";
          return (
            <div className="flex flex-col min-w-0">
              <Text size="md" weight="medium" className="text-slate-900 truncate">
                {schemeName}
              </Text>
              <Text size="md" variant="muted" className="truncate max-w-[240px]">
                {partner} · {unitType}
              </Text>
            </div>
          );
        },
      },
      {
        id: "teamLeader",
        header: "Team Leader",
        enableSorting: false,
        cell: ({ row }) => {
          const leader = getPropertyManagerLabel(row.original);
          return (
            <Text size="md" weight="normal" className="text-slate-800 truncate">
              {leader}
            </Text>
          );
        },
      },
      {
        id: "occupancy",
        header: "Occupancy",
        enableSorting: false,
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="w-32 space-y-1">
              <div className="flex items-center justify-between">
                <Text size="md" weight="medium" className="text-slate-900">
                  {p.occupiedBeds}/{p.totalBeds}
                </Text>
                <Text size="md" variant="muted">
                  {p.occupancyRate}%
                </Text>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-800 transition-all"
                  style={{ width: `${Math.min(100, p.occupancyRate)}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        id: "staffToday",
        header: "Staff today",
        enableSorting: false,
        cell: ({ row }) => {
          const p = row.original;
          const { assignedCount, requiredCount } = p.staffToday;
          return (
            <Text size="md" weight="medium" className="text-slate-800">
              {assignedCount}/{requiredCount} on shift
            </Text>
          );
        },
      },
      // {
      //   id: "safetyEvidence",
      //   header: "Safety Evidence",
      //   enableSorting: false,
      //   cell: ({ row }) => {
      //     const p = row.original;
      //     const st = p.safetyEvidenceStatus;
      //     const state =
      //       st === "On track" ? "success" : st === "Due soon" ? "warning" : "danger";
      //     return (
      //       <Badge variant="secondary" state={state} className="border gap-1">
      //         {st === "On track" ? (
      //           <CheckCircle2 className="size-3" />
      //         ) : (
      //           <AlertTriangle className="size-3" />
      //         )}
      //         {st}
      //       </Badge>
      //     );
      //   },
      // },
      {
        id: "status",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => {
          const p = row.original;
          const label =
            p.status === "Maintenance" ? "Under maintenance" : p.status || "Active";
          const state =
            p.status === "Active"
              ? "success"
              : p.status === "Maintenance"
                ? "warning"
                : "inactive";
          return (
            <Badge variant="secondary" state={state} className="border">
              {label}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div
              className="flex justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <RowActions
                onEdit={() => onEdit(p)}
                editLabel={`Edit ${p.name}`}
                onDelete={() => onDelete(p.id)}
                deleteLabel={`Delete ${p.name}`}
              />
            </div>
          );
        },
      },
    ],
    [onSelectProperty, onEdit, onDelete],
  );
}
