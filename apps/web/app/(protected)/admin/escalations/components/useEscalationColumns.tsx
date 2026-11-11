"use client";

import React, { useMemo } from "react";
import { FileCheck } from "lucide-react";
import { Button, Badge } from "@repo/ui/components/ui";

import { ClinicalEscalationItemDTO } from "@repo/schema";
import { TableColumn } from "../../../../../lib/components/shared/tableColumns";

interface UseEscalationColumnsProps {
  onSignOff: (item: ClinicalEscalationItemDTO) => void;
}

export function useEscalationColumns({
  onSignOff,
}: UseEscalationColumnsProps): TableColumn<ClinicalEscalationItemDTO>[] {
  return useMemo(
    () => [
      {
        kind: "index",
        id: "index",
        header: "#",
      },
      {
        id: "resident",
        header: "Resident",
        accessorFn: (row) => row.resident?.fullName || "Unknown",
        cell: ({ row, getValue }) => {
          const item = row.original;
          const value = getValue();
          const roomNumber = item.resident?.bed?.room?.roomNumber;
          return (
            <div className="flex flex-col">
              <span className="text-md font-semibold text-slate-900">{String(value)}</span>
              {roomNumber && (
                <span className="text-md text-slate-500">Room {roomNumber}</span>
              )}
            </div>
          );
        },
        enableSorting: true,
      },
      {
        id: "severity",
        header: "Severity",
        accessorFn: (row) => row.severity,
        cell: ({ getValue }) => {
          const value = getValue();
          const sev = String(value).toLowerCase();
          if (sev === "critical") {
            return <Badge variant="outline" className="text-md border-rose-200 bg-rose-50 text-rose-800">Critical</Badge>;
          }
          if (sev === "high") {
            return <Badge variant="outline" className="text-md border-orange-200 bg-orange-50 text-orange-800">High</Badge>;
          }
          return <Badge variant="outline" className="text-md border-amber-200 bg-amber-50 text-amber-800">Medium</Badge>;
        },
      },
      {
        id: "reason",
        header: "Reason",
        accessorFn: (row) => row.reason,
        cell: ({ getValue }) => {
          const value = getValue();
          return (
            <div className="font-medium text-md text-slate-700 max-w-[200px] truncate" title={String(value)}>
              {String(value)}
            </div>
          );
        },
      },
      {
        id: "date",
        header: "Date Logged",
        accessorFn: (row) => row.createdAt,
        cell: ({ getValue }) => {
          const value = getValue();
          return (
            <span className="text-slate-600 whitespace-nowrap text-md">
              {new Date(String(value)).toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex justify-end pr-4">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onSignOff(item);
                }}
                className="text-md h-8 rounded-lg border-purple-200 bg-purple-50 text-purple-900 hover:bg-purple-100 hover:text-purple-950 gap-1.5"
              >
                <FileCheck className="size-3.5" />
                {item.managerSignedAt ? "Update Sign-off" : "Manager Sign-off"}
              </Button>
            </div>
          );
        },
      },
    ],
    [onSignOff]
  );
}
