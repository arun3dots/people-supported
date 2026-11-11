"use client";

import React, { useMemo } from "react";
import { Eye, DoorOpen, CheckCircle2, AlertTriangle } from "lucide-react";
import { Text } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import type { PropertyItem } from "../../../../../../../../lib/types/facility";
import { RowActions } from "../../../../../../../../lib/components/shared/RowActions";
import type { TableColumn } from "../../../../../../../../lib/components/shared/tableColumns";

interface UsePropertyColumnsProps {
  onSelectProperty: (property: PropertyItem) => void;
  onEdit: (property: PropertyItem) => void;
  onDelete: (id: string) => void;
  onNavigate: (tab: string, extra?: Record<string, string>) => void;
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
  onNavigate,
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
              <div className="size-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-emerald-800 text-md shrink-0">
                {getInitials(p.name)}
              </div>
              <div className="flex flex-col min-w-0">
                <Text
                  size="sm"
                  weight="bold"
                  className="text-slate-900 group-hover:text-emerald-800 transition-colors truncate"
                >
                  {p.name}
                </Text>
                <span className="text-md text-slate-500 truncate max-w-[230px]">
                  {addr || p.description || "Supported Living Home"} · ID: {refId}
                </span>
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
          const schemeName = p.scheme?.name || "Supported Living Scheme";
          const partner =
            pd.landlordDetails?.name ||
            p.scheme?.housingPartner ||
            "Yorkshire Housing Association";
          const unitType =
            pd.unitConfiguration || pd.propertyType || "Self-contained flats";
          return (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-slate-900 truncate">
                {schemeName}
              </span>
              <span className="text-md text-slate-500 truncate max-w-[240px]">
                {partner} · {unitType}
              </span>
            </div>
          );
        },
      },
      {
        id: "teamLeader",
        header: "Team Leader",
        enableSorting: false,
        cell: ({ row }) => {
          const p = row.original;
          const leader =
            p.parsedPropertyDetails?.propertyManagerName ||
            p.primaryContact ||
            "Assigned Lead";
          return (
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-full bg-emerald-800 text-white text-md font-bold flex items-center justify-center shrink-0">
                {getInitials(leader)}
              </div>
              <span className="text-sm font-medium text-slate-800 truncate">
                {leader}
              </span>
            </div>
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
              <div className="flex items-center justify-between text-md">
                <span className="font-bold text-slate-900">
                  {p.occupiedBeds}/{p.totalBeds}
                </span>
                <span className="text-slate-500">{p.occupancyRate}%</span>
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
            <span className="text-md font-bold text-slate-800">
              {assignedCount}/{requiredCount} on shift
            </span>
          );
        },
      },
      {
        id: "safetyEvidence",
        header: "Safety Evidence",
        enableSorting: false,
        cell: ({ row }) => {
          const p = row.original;
          const st = p.safetyEvidenceStatus;
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-md font-semibold",
                st === "On track"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : st === "Due soon"
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-red-50 text-red-700 border border-red-200",
              )}
            >
              {st === "On track" ? (
                <CheckCircle2 className="size-3" />
              ) : (
                <AlertTriangle className="size-3" />
              )}
              {st}
            </span>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => {
          const p = row.original;
          const label =
            p.status === "Maintenance" ? "Under maintenance" : p.status || "Active";
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-md font-semibold",
                p.status === "Active"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : p.status === "Maintenance"
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-slate-100 text-slate-700 border border-slate-200",
              )}
            >
              {label}
            </span>
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
            <div className="flex justify-center gap-2">
              <RowActions
                onEdit={() => onEdit(p)}
                editLabel={`Edit ${p.name}`}
                onDelete={() => onDelete(p.id)}
                deleteLabel={`Delete ${p.name}`}
                extra={[
                  {
                    label: "View Tenancies & Safety",
                    icon: Eye,
                    onClick: () => onSelectProperty(p),
                  },
                  {
                    label: "Manage Rooms",
                    icon: DoorOpen,
                    onClick: () => onNavigate("rooms", { wingId: p.id }),
                  },
                ]}
              />
            </div>
          );
        },
      },
    ],
    [onSelectProperty, onEdit, onDelete, onNavigate],
  );
}
