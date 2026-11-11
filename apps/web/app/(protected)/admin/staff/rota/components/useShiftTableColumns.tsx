"use client";

import { useMemo } from "react";
import { Edit2 } from "lucide-react";
import { Button, Text } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import type { TableColumn } from "../../../../../../lib/components/shared/tableColumns";
import type { Shift } from "../../../../../../lib/types/shifts";
import type { StaffMember } from "../../../../../../lib/types/staff";
import { formatUkDate, formatUkTime } from "../../../../../../lib/utils/uk-date-time";

export interface ShiftTableColumnOptions {
  currentPage: number;
  pageSize: number;
  staffMap: Map<string, StaffMember>;
  wingMap: Map<string, { id: string; name: string; branchName?: string; branch?: { id: string; name: string } }>;
  residentWingMap: Map<string, { wingName?: string; branchName?: string }>;
  facilityNameProp?: string;
  onEditShift: (shift: Shift) => void;
}

function getStatusBadgeStyle(status?: string): string {
  const lower = status?.toLowerCase() || "";
  switch (lower) {
    case "completed": return "bg-emerald-50 text-emerald-800 border-emerald-200/80";
    case "published": return "bg-primary/10 text-primary border-primary/25";
    case "started": return "bg-blue-50 text-blue-700 border-blue-200/80";
    case "draft": return "bg-amber-50 text-amber-700 border-amber-200/80";
    case "cancelled":
    case "missed":
    case "ended": return "bg-rose-50 text-rose-700 border-rose-200/80";
    default: return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function useShiftTableColumns({
  currentPage,
  pageSize,
  staffMap,
  wingMap,
  residentWingMap,
  facilityNameProp,
  onEditShift,
}: ShiftTableColumnOptions): TableColumn<Shift>[] {
  return useMemo<TableColumn<Shift>[]>(
    () => [
      {
        id: "serialNumber",
        header: "#",
        align: "left",
        cell: ({ row }) => {
          const indexNum = (currentPage - 1) * pageSize + row.index + 1;
          return (
            <Text size="md" weight="normal" className="text-slate-600">
              {indexNum}
            </Text>
          );
        },
      },
      {
        id: "staffMember",
        header: "Staff Member",
        cell: ({ row }) => {
          const assignments = row.original.assignments || [];
          const assignedUsers = assignments
            .map((a) => a.user)
            .filter((u): u is NonNullable<typeof u> => Boolean(u && staffMap.has(u.id)));

          if (assignedUsers.length === 0) {
            return (
              <span className="inline-flex items-center text-md font-normal text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60">
                Unassigned
              </span>
            );
          }

          const primaryUser = assignedUsers[0];
          const staffProfile = primaryUser?.id ? staffMap.get(primaryUser.id) : undefined;
          const roleTitle = staffProfile?.role?.name || "Care Staff";
          const names = assignedUsers.map((u) => u?.fullName).filter(Boolean).join(", ");

          return (
            <div className="flex flex-col min-w-0">
              <Text size="md" weight="normal" className="text-slate-800 truncate">
                {names || primaryUser?.fullName || "Staff Member"}
              </Text>
              <Text size="md" weight="normal" className="text-slate-400 truncate">
                {roleTitle}
              </Text>
            </div>
          );
        },
      },
      {
        id: "facilityWing",
        header: "Facility & Wing",
        cell: ({ row }) => {
          const shift = row.original;
          const matchedWing = (shift.wing || (shift.wingId ? wingMap.get(shift.wingId) : undefined)) as { name?: string; branch?: { name?: string }; branchName?: string } | undefined;
          const assignedIds = shift.assignments?.flatMap((a) => a.assignedResidentIds || []) || [];
          const resWing = assignedIds.map((id) => residentWingMap.get(id)).find(Boolean);

          const isFacilityWide = !shift.wingId && !shift.wing && !resWing?.wingName;
          const wingName =
            matchedWing?.name ||
            resWing?.wingName ||
            (shift.wardName && shift.wardName !== "Main Facility" ? shift.wardName : null) ||
            (isFacilityWide ? "Facility Wide" : "Area Wing");

          const shiftBranch = (shift as { branch?: { name?: string } }).branch;
          const facilityName =
            shiftBranch?.name ||
            matchedWing?.branch?.name ||
            matchedWing?.branchName ||
            resWing?.branchName ||
            facilityNameProp ||
            "Main Facility";

          return (
            <div className="flex flex-col min-w-0">
              <Text size="md" weight="normal" className="text-slate-800 truncate">
                {wingName}
              </Text>
              <Text size="md" weight="normal" className="text-slate-400 truncate">
                {facilityName}
              </Text>
            </div>
          );
        },
      },
      {
        id: "shiftTypeAndDate",
        header: "Shift Type & Date",
        cell: ({ row }) => {
          const shiftType = row.original.type?.name || row.original.name || "Shift";
          const dateObj = row.original.startTime ? new Date(row.original.startTime) : null;
          const formattedDate = dateObj && !isNaN(dateObj.getTime())
            ? formatUkDate(dateObj, {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—";

          return (
            <div className="flex flex-col min-w-0">
              <Text size="md" weight="normal" className="text-slate-800 truncate">
                {shiftType}
              </Text>
              <Text size="md" weight="normal" className="text-slate-400 mt-0.5">
                {formattedDate}
              </Text>
            </div>
          );
        },
      },
      {
        id: "timing",
        header: "Timing",
        cell: ({ row }) => {
          let timingText = row.original.timingFormatted;
          if (!timingText && row.original.startTime && row.original.endTime) {
            const s = new Date(row.original.startTime);
            const e = new Date(row.original.endTime);
            if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
              timingText = `${formatUkTime(s)} – ${formatUkTime(e)}`;
            }
          }
          timingText = timingText || "—";

          let durationText = "";
          if (row.original.startTime && row.original.endTime) {
            const s = new Date(row.original.startTime).getTime();
            const e = new Date(row.original.endTime).getTime();
            if (!isNaN(s) && !isNaN(e) && e > s) {
              const hours = Math.round(((e - s) / (1000 * 60 * 60)) * 10) / 10;
              if (hours > 0) durationText = `${hours} hrs`;
            }
          }

          return (
            <div className="flex flex-col min-w-0">
              <Text size="md" weight="normal" className="text-slate-800 whitespace-nowrap">
                {timingText}
              </Text>
              {durationText && (
                <Text size="md" weight="normal" className="text-slate-400">
                  {durationText}
                </Text>
              )}
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status || "Scheduled";
          return (
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-1 rounded-full text-md font-normal border",
                getStatusBadgeStyle(status),
              )}
            >
              {status}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="text-right block w-full pr-2">Actions</span>,
        align: "right",
        cell: ({ row }) => (
          <div className="flex items-center justify-end pr-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEditShift(row.original);
              }}
              className="size-8 p-0 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="Edit Shift"
            >
              <Edit2 className="size-4" />
              <span className="sr-only">Edit Shift</span>
            </Button>
          </div>
        ),
      },
    ],
    [currentPage, pageSize, staffMap, wingMap, residentWingMap, facilityNameProp, onEditShift],
  );
}

