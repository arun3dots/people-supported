"use client";

import React, { useMemo } from "react";
import { Mail, Phone, Home, Building2 } from "lucide-react";
import { Badge, Text } from "@repo/ui/components/ui";
import type { StaffMember } from "../../../../../lib/types/staff";
import { RowActions } from "../../../../../lib/components/shared/RowActions";
import type {
  TableColumn,
  BadgeState,
} from "../../../../../lib/components/shared/tableColumns";

interface UseStaffColumnsProps {
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
}

export function getStaffStatusBadgeState(
  isActive: boolean,
): BadgeState {
  return isActive ? "success" : "inactive";
}

export function useStaffColumns({
  onToggleStatus,
  onDelete,
}: UseStaffColumnsProps): TableColumn<StaffMember>[] {
  return useMemo<TableColumn<StaffMember>[]>(
    () => [
      {
        kind: "index",
        id: "index",
        header: "#",
      },
      {
        id: "staffMember",
        header: "Staff Member",
        cell: ({ row }) => {
          const m = row.original;
          const initials = m.fullName
            ? m.fullName
                .split(" ")
                .filter(Boolean)
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()
            : "ST";
          const staffId = `STA-${m.id.slice(0, 3).toUpperCase()}`;
          return (
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full bg-slate-800 text-white font-bold text-md flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <Text size="sm" weight="bold" className="text-slate-900 truncate">
                  {m.fullName || "—"}
                </Text>
                <Text size="md" variant="subdued" className="text-slate-500">
                  {staffId}
                </Text>
              </div>
            </div>
          );
        },
      },
      {
        id: "role",
        header: "Role",
        cell: ({ row }) => {
          const roleName = row.original.role?.name || "Support Worker";
          const lower = roleName.toLowerCase();
          const isSenior = lower.includes("senior") || lower.includes("leader");
          const isNurse = lower.includes("nurse");
          const isNight = lower.includes("night");

          let colorClass = "bg-emerald-50 text-emerald-800 border-emerald-200/60";
          if (isNurse) {
            colorClass = "bg-rose-50 text-rose-800 border-rose-200/60";
          } else if (isNight) {
            colorClass = "bg-amber-50 text-amber-800 border-amber-200/60";
          } else if (isSenior) {
            colorClass = "bg-teal-50 text-teal-800 border-teal-200/60";
          }

          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-md font-semibold border ${colorClass}`}
            >
              {roleName}
            </span>
          );
        },
      },
      {
        id: "scheme",
        header: "Scheme",
        cell: ({ row }) => {
          const m = row.original;
          const schemeName =
            m.scheme?.name ||
            (m as { employmentDetails?: { schemeName?: string } })
              ?.employmentDetails?.schemeName ||
            "North Yorkshire Supported Living";
          return (
            <div className="flex items-center gap-1.5 text-slate-700 max-w-[200px]">
              <Building2 className="size-3.5 text-slate-400 shrink-0" />
              <span className="text-md truncate font-medium">{schemeName}</span>
            </div>
          );
        },
      },
      {
        id: "property",
        header: "Property",
        cell: ({ row }) => {
          const m = row.original;
          const propertyName =
            m.property?.name || m.assignedWings?.[0]?.name || "Oak House";
          return (
            <div className="flex items-center gap-1.5 text-slate-700 max-w-[160px]">
              <Home className="size-3.5 text-slate-400 shrink-0" />
              <span className="text-md truncate font-medium">{propertyName}</span>
            </div>
          );
        },
      },
      {
        id: "contact",
        header: "Contact",
        cell: ({ row }) => {
          const member = row.original;
          return (
            <div className="flex flex-col gap-0.5 text-md">
              <div className="flex items-center gap-1.5 text-slate-700">
                <Phone className="size-3 text-slate-400 shrink-0" />
                <span>{member.phoneNumber || "+44 7712 345678"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <Mail className="size-3 text-slate-400 shrink-0" />
                <span className="truncate max-w-[180px]">{member.email}</span>
              </div>
            </div>
          );
        },
      },
      {
        id: "status",
        accessorKey: "isActive",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => {
          const member = row.original;
          return (
            <div
              className="flex items-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <Badge
                variant="secondary"
                state={getStaffStatusBadgeState(member.isActive)}
                className="cursor-pointer px-2.5 py-0.5 shadow-none"
                onClick={() => onToggleStatus(member.id, member.isActive)}
              >
                {member.isActive ? "Active" : "Inactive"}
              </Badge>
              {member.isOnLeave && (
                <Badge
                  variant="secondary"
                  state="warning"
                  className="px-2 py-0.5 shadow-none"
                >
                  On Leave
                </Badge>
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
          const member = row.original;
          return (
            <div
              className="flex items-center justify-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <RowActions
                onDelete={() => onDelete(member.id)}
                deleteLabel="Remove Staff Member"
              />
            </div>
          );
        },
      },
    ],
    [onToggleStatus, onDelete],
  );
}
