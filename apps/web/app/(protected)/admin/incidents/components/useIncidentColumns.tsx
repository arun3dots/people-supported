"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Eye } from "lucide-react";
import { Button } from "@repo/ui/components/ui";
import type { Incident } from "../../../../../lib/types/incident";
import type {
  TableColumn,
  BadgeState,
} from "../../../../../lib/components/shared/tableColumns";

export function getIncidentStatusBadgeState(status: string): BadgeState {
  switch (status) {
    case "Closed":
    case "Resolved":
      return "success";
    case "Draft":
      return "inactive";
    case "Under Review":
    case "Under Investigation":
      return "info";
    case "Open":
      return "warning";
    default:
      return "inactive";
  }
}

export function getIncidentPriorityBadgeState(priority: string): BadgeState {
  switch (priority) {
    case "High":
      return "danger";
    case "Medium":
      return "warning";
    case "Low":
      return "success";
    default:
      return "info";
  }
}

export function getIncidentStatusDotColor(status: string): string {
  switch (status) {
    case "Draft":
      return "bg-slate-400";
    case "Closed":
    case "Resolved":
    case "Low":
      return "bg-emerald-500";
    case "Under Review":
    case "Under Investigation":
      return "bg-blue-500";
    case "Open":
    case "Medium":
      return "bg-amber-500";
    case "High":
      return "bg-red-500";
    default:
      return "bg-slate-400";
  }
}

function formatDateLabel(dateStr?: string | Date): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "—" : format(d, "dd MMM yyyy");
  } catch {
    return "—";
  }
}

export function useIncidentColumns(): TableColumn<Incident>[] {
  return useMemo<TableColumn<Incident>[]>(
    () => [
      {
        kind: "index",
        id: "index",
        header: "#",
      },
      {
        kind: "person",
        id: "incident",
        accessorKey: "title",
        header: "Incident",
        avatar: false,
        maxWidthClassName: "max-w-64",
        dotColor: (i) => getIncidentStatusDotColor(i.priority || "Medium"),
        getTitle: (i) => i.title,
        getSubtitle: (i) =>
          i.incidentNumber ? `Ref: #${i.incidentNumber}` : null,
      },
      {
        kind: "person",
        id: "resident",
        avatar: true,
        header: "Resident",
        maxWidthClassName: "max-w-56",
        getTitle: (i) => i.resident?.fullName || "Unassigned",
        getSubtitle: (i) => {
          const room =
            i.roomNumber ||
            i.resident?.bed?.room?.roomNumber ||
            "Unassigned";
          const bed = i.bedNumber || i.resident?.bed?.number || "Unassigned";
          return `Room ${room} • Bed ${bed}`;
        },
        getInitials: (i) =>
          (i.resident?.fullName || "Unassigned").charAt(0).toUpperCase(),
        getImageUrl: (i) => i.resident?.photoUrl || null,
      },
      {
        kind: "person",
        id: "dateTime",
        accessorKey: "incidentDate",
        header: "Date & Time",
        enableSorting: false,
        avatar: false,
        getTitle: (i) => formatDateLabel(i.incidentDate),
        getSubtitle: (i) => i.incidentTime || null,
      },
      {
        kind: "text",
        id: "category",
        accessorKey: "category",
        header: "Category",
        state: "info",
      },
      {
        kind: "badge",
        id: "status",
        accessorKey: "status",
        header: "Status",
        getState: (i) => getIncidentStatusBadgeState(i.status || "Open"),
        getLabel: (i) => i.status || "Open",
      },
      {
        kind: "badge",
        id: "priority",
        accessorKey: "priority",
        header: "Priority",
        getState: (i) => getIncidentPriorityBadgeState(i.priority || "Medium"),
        getLabel: (i) => i.priority || "Medium",
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => {
          const incident = row.original;
          return (
            <div
              className="flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Link href={`/admin/incidents/${incident.id}`} className="hover:text-emerald-700">
                <Button
                  size="sm"
                  variant="ghost"
                >
                  <Eye className="size-3.5 text-emerald-800 hover:text-emerald-700" />
                  View
                </Button>
              </Link>
            </div>
          );
        },
      },
    ],
    [],
  );
}
