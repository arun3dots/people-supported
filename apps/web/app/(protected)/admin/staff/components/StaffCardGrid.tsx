"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Home, Mail, Phone, Trash2 } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Text,
} from "@repo/ui/components/ui";
import { EntityCard } from "../../../../../lib/components/shared";
import type {
  PropertyItem,
  SchemeItem,
} from "../../../../../lib/types/facility";
import type { StaffMember } from "../../../../../lib/types/staff";
import {
  getStaffInitials,
  getStaffRoleBadgeState,
  resolveStaffLocation,
} from "./staffUtils";

export interface StaffCardProps {
  member: StaffMember;
  schemes?: SchemeItem[];
  properties?: PropertyItem[];
  showRightDivider?: boolean;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
}

export function StaffCard({
  member,
  schemes = [],
  properties = [],
  showRightDivider = false,
  onToggleStatus,
  onDelete,
}: StaffCardProps) {
  const router = useRouter();
  const initials = getStaffInitials(member.fullName);
  const roleName = member.role?.name;
  const { schemeName, propertyName } = resolveStaffLocation(
    member,
    schemes,
    properties,
  );
  const phone = member.phoneNumber?.trim();
  const subtitleParts = [
    member.department,
    member.contractType,
  ].filter(Boolean);

  return (
    <EntityCard
      onClick={() => router.push(`/admin/staff/${member.id}`)}
      showRightDivider={showRightDivider}
      className="border-slate-200/60 shadow-none hover:shadow-xs"
      avatar={
        <Avatar
          size="sm"
          className="size-11 shrink-0 bg-surface-primary-light"
        >
          {member.avatarUrl && (
            <AvatarImage
              src={member.avatarUrl}
              alt={member.fullName}
              className="object-cover"
            />
          )}
          <AvatarFallback className="bg-surface-primary-light text-primary font-semibold text-md">
            {initials}
          </AvatarFallback>
        </Avatar>
      }
      title={
        <Link
          href={`/admin/staff/${member.id}`}
          onClick={(e) => e.stopPropagation()}
          className="block min-w-0 hover:text-primary transition-colors"
        >
          <Text size="md" weight="semibold" className="text-slate-900 truncate">
            {member.fullName}
          </Text>
        </Link>
      }
      subtitle={subtitleParts.length > 0 ? subtitleParts.join(" · ") : member.email}
      headerBadge={
        <Badge
          variant="secondary"
          state={roleName ? getStaffRoleBadgeState(roleName) : "inactive"}
          className="px-2.5 py-0.5 shadow-none font-medium text-md"
        >
          {roleName || "Unassigned"}
        </Badge>
      }
      meta={[
        {
          icon: <Building2 className="size-4 text-primary shrink-0" />,
          label: "Scheme",
          value: schemeName || "Unassigned",
        },
        {
          icon: <Home className="size-4 text-primary shrink-0" />,
          label: "Property",
          value: propertyName || "Unassigned",
        },
        {
          icon: <Mail className="size-4 text-primary shrink-0" />,
          value: member.email || "—",
        },
        {
          icon: <Phone className="size-4 text-primary shrink-0" />,
          value: phone || "No phone registered",
        },
      ]}
      statusText={
        member.isOnLeave ? "On Leave" : member.isActive ? "Active" : "Inactive"
      }
      statusState={
        member.isOnLeave ? "warning" : member.isActive ? "success" : "inactive"
      }
      onStatusClick={() => onToggleStatus(member.id, member.isActive)}
      actions={
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(member.id);
          }}
          title="Remove Staff Member"
        >
          <Trash2 className="size-4" />
        </Button>
      }
    />
  );
}

export interface StaffCardGridProps {
  staffList?: StaffMember[];
  paginatedStaff: StaffMember[];
  schemes?: SchemeItem[];
  properties?: PropertyItem[];
  isLoading: boolean;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
}

export function StaffCardGrid({
  paginatedStaff,
  schemes = [],
  properties = [],
  onToggleStatus,
  onDelete,
}: StaffCardGridProps) {
  if (!paginatedStaff || paginatedStaff.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
      {paginatedStaff.map((member, idx) => (
        <StaffCard
          key={member.id}
          member={member}
          schemes={schemes}
          properties={properties}
          showRightDivider={
            idx % 3 !== 2 && idx !== paginatedStaff.length - 1
          }
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
