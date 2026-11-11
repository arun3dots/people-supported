"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Mail, Phone } from "lucide-react";
import {
  Button,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@repo/ui/components/ui";
import { EntityCard } from "../../../../../lib/components/shared";
import type { StaffMember } from "../../../../../lib/types/staff";

export interface StaffCardProps {
  member: StaffMember;
  showRightDivider?: boolean;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
}

export function StaffCard({
  member,
  showRightDivider = false,
  onToggleStatus,
  onDelete,
}: StaffCardProps) {
  const router = useRouter();
  const initial = member.fullName?.charAt(0)?.toUpperCase() || "S";

  return (
    <EntityCard
      onClick={() => router.push(`/admin/staff/${member.id}`)}
      showRightDivider={showRightDivider}
      avatar={
        <Avatar size="sm" className="size-11 border border-slate-200 shrink-0 bg-surface-primary-light">
          {member.avatarUrl && (
            <AvatarImage
              src={member.avatarUrl}
              alt={member.fullName}
              className="object-cover"
            />
          )}
          <AvatarFallback className="bg-surface-primary-light text-icon-primary font-bold text-base">
            {initial}
          </AvatarFallback>
        </Avatar>
      }
      title={
        <Link
          href={`/admin/staff/${member.id}`}
          onClick={(e) => e.stopPropagation()}
          className="hover:text-emerald-800 transition-colors"
        >
          {member.fullName}
        </Link>
      }
      subtitle={member.role?.name || "Staff Member"}
      meta={[
        {
          icon: <Mail className="size-4 text-emerald-800 shrink-0" />,
          value: member.email,
        },
        {
          icon: <Phone className="size-4 text-emerald-800 shrink-0" />,
          value: member.phoneNumber || "No phone registered",
        },
      ]}
      statusText={member.isOnLeave ? "On Leave" : member.isActive ? "Active" : "Inactive"}
      statusState={member.isOnLeave ? "warning" : member.isActive ? "success" : "inactive"}
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
  isLoading: boolean;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
}

export function StaffCardGrid({
  paginatedStaff,
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
