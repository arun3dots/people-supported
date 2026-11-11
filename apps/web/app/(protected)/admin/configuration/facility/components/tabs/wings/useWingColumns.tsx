"use client";

import React, { useMemo } from "react";
import { DoorOpen, BedDouble, Eye } from "lucide-react";
import { Text } from "@repo/ui/components/ui";
import type { Wing } from "../../../../../../../../lib/types/facility";
import { RowActions } from "../../../../../../../../lib/components/shared/RowActions";
import type {
  TableColumn,
  BadgeState,
} from "../../../../../../../../lib/components/shared/tableColumns";

interface UseWingColumnsProps {
  onEdit: (wing: Wing) => void;
  onDelete: (id: string) => void;
  onNavigate: (tab: string, extra?: Record<string, string>) => void;
}

function wingStatusState(status?: string): BadgeState {
  return status === "Active" ? "success" : "inactive";
}

export function useWingColumns({
  onEdit,
  onDelete,
  onNavigate,
}: UseWingColumnsProps): TableColumn<Wing>[] {
  return useMemo<TableColumn<Wing>[]>(
    () => [
      {
        kind: "index",
        id: "index",
        header: "#",
      },
      {
        id: "wingDetails",
        accessorKey: "name",
        header: "Wing Details",
        enableSorting: false,
        cell: ({ row }) => {
          const w = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full bg-surface-primary-light flex items-center justify-center font-bold text-icon-primary text-md shrink-0">
                {w.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <Text size="sm" weight="regular" className="text-slate-900 truncate">
                  {w.name}
                </Text>
                <Text size="sm" weight="regular" className="text-slate-500 truncate">
                  {w.branch?.name ? `Branch: ${w.branch.name}` : w.description || "Care Wing"}
                </Text>
              </div>
            </div>
          );
        },
      },
      {
        kind: "count",
        id: "totalRooms",
        accessorKey: "totalRooms",
        header: "Rooms",
        icon: DoorOpen,
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
        getState: (w) => wingStatusState(w.status),
        getLabel: (w) => w.status || "Active",
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
          const w = row.original;
          return (
            <div className="flex justify-center gap-2">
              <RowActions
                onEdit={() => onEdit(w)}
                editLabel={`Edit ${w.name}`}
                onDelete={() => onDelete(w.id)}
                deleteLabel={`Delete ${w.name}`}
                extra={[
                  {
                    label: "View Rooms",
                    icon: Eye,
                    onClick: () => onNavigate("rooms", { wingId: w.id }),
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
