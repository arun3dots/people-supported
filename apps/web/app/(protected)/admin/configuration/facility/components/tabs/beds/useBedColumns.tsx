"use client";

import React, { useMemo } from "react";
import { BedDouble, LogOut, UserPlus } from "lucide-react";
import { Button, Text } from "@repo/ui/components/ui";
import type { Bed } from "../../../../../../../../lib/types/facility";
import { RowActions } from "../../../../../../../../lib/components/shared/RowActions";
import type {
  TableColumn,
  BadgeState,
} from "../../../../../../../../lib/components/shared/tableColumns";

interface UseBedColumnsProps {
  onEdit: (bed: Bed) => void;
  onDelete: (id: string) => void;
  onAssignResident: (bed: Bed) => void;
  onDischargeResident: (resident: { id: string; fullName: string }) => void;
}

function isBedOccupied(b: Bed): boolean {
  return !!(b.residentId || b.residentName);
}

function bedStatus(b: Bed): { label: string; state: BadgeState } {
  const displayStatus = isBedOccupied(b)
    ? "Occupied"
    : b.status || "Available";
  let state: BadgeState = "inactive";
  if (displayStatus === "Occupied") state = "info";
  else if (displayStatus === "Available") state = "success";
  else if (displayStatus === "Maintenance") state = "warning";
  return { label: displayStatus, state };
}

export function useBedColumns({
  onEdit,
  onDelete,
  onAssignResident,
  onDischargeResident,
}: UseBedColumnsProps): TableColumn<Bed>[] {
  return useMemo<TableColumn<Bed>[]>(
    () => [
      {
        kind: "index",
        id: "index",
        header: "#",
      },
      {
        id: "resident",
        accessorKey: "residentName",
        header: "Resident",
        enableSorting: false,
        cell: ({ row }) => {
          const b = row.original;
          const occupied = isBedOccupied(b);
          const initials = b.residentName
            ? b.residentName
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .slice(0, 2)
            : "—";

          return (
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-11 rounded-full bg-surface-primary-light flex items-center justify-center font-bold text-icon-primary text-base shrink-0 overflow-hidden">
                {occupied ? initials : <BedDouble className="size-5 text-icon-primary" />}
              </div>
              <div className="flex flex-col min-w-0 gap-1">
                <Text size="sm" className="truncate text-slate-900">
                  {b.residentName || "Unassigned"}
                </Text>
                <Text size="sm" weight="regular" className="text-slate-500">
                  {occupied ? "Resident assigned" : "Available for assignment"}
                </Text>
              </div>
            </div>
          );
        },
      },
      {
        kind: "text",
        id: "bed",
        accessorKey: "number",
        header: "Bed",
        tone: "secondary",
        getValue: (b) => b.number || b.code || undefined,
        fallback: "—",
      },
      {
        kind: "text",
        id: "room",
        accessorKey: "roomNumber",
        header: "Room",
        tone: "secondary",
        getValue: (b) => (b.roomNumber ? `Room ${b.roomNumber}` : undefined),
        fallback: "—",
      },
      {
        kind: "text",
        id: "wingName",
        accessorKey: "wingName",
        header: "Dept/Wing",
        tone: "secondary",
        fallback: "—",
      },
      {
        kind: "date",
        id: "residentAdmissionDate",
        accessorKey: "residentAdmissionDate",
        header: "Admitted Date",
        fallback: "—",
      },
      {
        kind: "date",
        id: "expectedDischargeDate",
        accessorKey: "expectedDischargeDate",
        header: "Exp. Discharge",
        fallback: "—",
      },
      {
        kind: "badge",
        id: "status",
        accessorKey: "status",
        header: "Status",
        getState: (b) => bedStatus(b).state,
        getLabel: (b) => bedStatus(b).label,
      },
      {
        id: "quickAction",
        header: "Quick Action",
        enableSorting: false,
        cell: ({ row }) => {
          const b = row.original;
          const occupied = isBedOccupied(b);
          return (
            <div>
              {occupied ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onDischargeResident({
                      id: b.residentId || "",
                      fullName: b.residentName || "Resident",
                    })
                  }
                  className="h-8 text-md text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-xl gap-1.5 cursor-pointer"
                >
                  <LogOut className="size-3.5" />
                  Discharge
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onAssignResident(b)}
                  className="h-8 text-md text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-300 rounded-xl gap-1.5 cursor-pointer"
                >
                  <UserPlus className="size-3.5" />
                  Assign
                </Button>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => {
          const b = row.original;
          return (
            <div className="flex justify-center gap-2">
              <RowActions
                onEdit={() => onEdit(b)}
                editLabel={`Edit Bed ${b.number || b.code || ""}`.trim()}
                onDelete={() => onDelete(b.id)}
                deleteLabel={`Delete Bed ${b.number || b.code || ""}`.trim()}
              />
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete, onAssignResident, onDischargeResident],
  );
}
