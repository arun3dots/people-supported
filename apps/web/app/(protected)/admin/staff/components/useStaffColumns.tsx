"use client";

import React, { useMemo } from "react";
import { Mail, Phone, Home, Building2 } from "lucide-react";
import { Badge, Text } from "@repo/ui/components/ui";
import type {
  PropertyItem,
  SchemeItem,
} from "../../../../../lib/types/facility";
import type { StaffMember } from "../../../../../lib/types/staff";
import { RowActions } from "../../../../../lib/components/shared/RowActions";
import type {
  TableColumn,
  BadgeState,
} from "../../../../../lib/components/shared/tableColumns";
import {
  getStaffInitials,
  getStaffRoleBadgeState,
  resolveStaffLocation,
} from "./staffUtils";

interface UseStaffColumnsProps {
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
  schemes?: SchemeItem[];
  properties?: PropertyItem[];
}

export function getStaffStatusBadgeState(isActive: boolean): BadgeState {
  return isActive ? "success" : "inactive";
}

export function useStaffColumns({
  onToggleStatus,
  onDelete,
  schemes = [],
  properties = [],
}: UseStaffColumnsProps): TableColumn<StaffMember>[] {
  return useMemo<TableColumn<StaffMember>[]>(
    () => [
      {
        kind: "index",
        id: "index",
        header: "#",
      },
      {
        kind: "person",
        id: "staffMember",
        accessorKey: "fullName",
        header: "Staff Member",
        maxWidthClassName: "max-w-60",
        avatar: true,
        avatarClassName: "size-10 shrink-0 bg-surface-primary-light",
        fallbackClassName:
          "bg-surface-primary-light text-primary font-semibold text-md",
        getTitle: (m) => m.fullName || "—",
        getSubtitle: (m) => m.department || m.contractType || null,
        getInitials: (m) => getStaffInitials(m.fullName),
        getImageUrl: (m) => m.avatarUrl || null,
      },
      {
        id: "role",
        header: "Role",
        cell: ({ row }) => {
          const roleName = row.original.role?.name;
          return (
            <Badge
              variant="secondary"
              state={roleName ? getStaffRoleBadgeState(roleName) : "inactive"}
              className="px-2.5 py-0.5 shadow-none font-medium"
            >
              {roleName || "Unassigned"}
            </Badge>
          );
        },
      },
      {
        id: "scheme",
        header: "Scheme",
        cell: ({ row }) => {
          const { schemeName } = resolveStaffLocation(
            row.original,
            schemes,
            properties,
          );
          return (
            <div className="flex items-center gap-1.5 max-w-48">
              <Building2 className="size-3.5 text-slate-400 shrink-0" />
              <Text
                size="md"
                weight={schemeName ? "medium" : "regular"}
                className={
                  schemeName
                    ? "text-slate-800 truncate"
                    : "text-slate-400 truncate"
                }
              >
                {schemeName || "Unassigned"}
              </Text>
            </div>
          );
        },
      },
      {
        id: "property",
        header: "Property",
        cell: ({ row }) => {
          const { propertyName } = resolveStaffLocation(
            row.original,
            schemes,
            properties,
          );
          return (
            <div className="flex items-center gap-1.5 max-w-44">
              <Home className="size-3.5 text-slate-400 shrink-0" />
              <Text
                size="md"
                weight={propertyName ? "medium" : "regular"}
                className={
                  propertyName
                    ? "text-slate-800 truncate"
                    : "text-slate-400 truncate"
                }
              >
                {propertyName || "Unassigned"}
              </Text>
            </div>
          );
        },
      },
      {
        id: "contact",
        header: "Contact",
        cell: ({ row }) => {
          const member = row.original;
          const phone = member.phoneNumber?.trim();
          return (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <Phone className="size-3 text-slate-400 shrink-0" />
                <Text
                  size="md"
                  weight={phone ? "medium" : "regular"}
                  className={phone ? "text-slate-800" : "text-slate-400"}
                >
                  {phone || "No phone registered"}
                </Text>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="size-3 text-slate-400 shrink-0" />
                <Text size="md" variant="muted" className="truncate max-w-44">
                  {member.email || "—"}
                </Text>
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
                className="cursor-pointer px-2.5 py-0.5 shadow-none font-medium"
                onClick={() => onToggleStatus(member.id, member.isActive)}
              >
                {member.isActive ? "Active" : "Inactive"}
              </Badge>
              {member.isOnLeave && (
                <Badge
                  variant="secondary"
                  state="warning"
                  className="px-2 py-0.5 shadow-none font-medium"
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
    [onToggleStatus, onDelete, schemes, properties],
  );
}
