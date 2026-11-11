"use client";

import React, { useMemo } from "react";
import { BedDouble, Eye } from "lucide-react";
import { Text } from "@repo/ui/components/ui";
import type { Room } from "../../../../../../../../lib/types/facility";
import { RowActions } from "../../../../../../../../lib/components/shared/RowActions";
import type {
  TableColumn,
  BadgeState,
} from "../../../../../../../../lib/components/shared/tableColumns";

interface UseRoomColumnsProps {
  onEdit: (room: Room) => void;
  onDelete: (id: string) => void;
  onNavigate: (tab: string, extra?: Record<string, string>) => void;
}

function getRoomType(type?: string): string {
  if (!type) return "Standard";
  return type.replace(/_/g, " ");
}

function formatRoomLabel(roomNumber: string): string {
  const trimmed = roomNumber.trim();
  return /^room\b/i.test(trimmed) ? trimmed : `Room ${trimmed}`;
}

function roomStatusState(status?: string): BadgeState {
  return status === "Active" ? "success" : "inactive";
}

export function useRoomColumns({
  onEdit,
  onDelete,
  onNavigate,
}: UseRoomColumnsProps): TableColumn<Room>[] {
  return useMemo<TableColumn<Room>[]>(
    () => [
      {
        kind: "index",
        id: "index",
        header: "#",
      },
      {
        id: "roomDetails",
        accessorKey: "roomNumber",
        header: "Room Details",
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          const label = formatRoomLabel(r.roomNumber);
          return (
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full bg-surface-primary-light flex items-center justify-center font-medium text-icon-primary text-md shrink-0 overflow-hidden">
                {r.roomNumber.replace(/[^0-9]/g, "").slice(0, 2) || r.roomNumber.slice(0, 2)}
              </div>
              <div className="flex flex-col min-w-0">
                <Text size="sm" className="text-slate-900 truncate">
                  {label}
                </Text>
                <Text size="sm" weight="regular" className="text-slate-500 truncate">
                  {r.name || "Resident Room"} · {r.wing?.name || r.wingName || "Unassigned"}
                </Text>
              </div>
            </div>
          );
        },
      },
      {
        kind: "badge",
        id: "type",
        accessorKey: "type",
        header: "Type",
        state: "info",
        getLabel: (r) => getRoomType(r.type),
      },
      {
        kind: "count",
        id: "totalBeds",
        accessorKey: "totalBeds",
        header: "Beds",
        icon: BedDouble,
      },
      {
        kind: "badge",
        id: "status",
        accessorKey: "status",
        header: "Status",
        getState: (r) => roomStatusState(r.status),
        getLabel: (r) => r.status || "Active",
      },
      {
        kind: "date",
        id: "createdAt",
        accessorKey: "createdAt",
        header: "Created",
        format: "MMM d, yyyy",
        fallback: "—",
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          const label = formatRoomLabel(r.roomNumber);
          return (
            <div className="flex justify-center gap-2">
              <RowActions
                onEdit={() => onEdit(r)}
                editLabel={`Edit ${label}`}
                onDelete={() => onDelete(r.id)}
                deleteLabel={`Delete ${label}`}
                extra={[
                  {
                    label: "View Beds",
                    icon: Eye,
                    onClick: () => onNavigate("beds", { roomId: r.id }),
                  },
                ]}
              />
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete, onNavigate],
  );
}
