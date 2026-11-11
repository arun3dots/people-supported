"use client";

import React from "react";
import { format } from "date-fns";
import { Clock, Monitor, MapPin } from "lucide-react";
import {
  Badge,
  Avatar,
  AvatarFallback,
} from "@repo/ui/components/ui";
import { EntityCard } from "../../../../../lib/components/shared";
import type { AuditLog as AuditLogItem } from "../../../../../lib/queries/audit/useGetAuditLogsQuery";
import {
  getActivityBadgeState,
  getActivityBadgeLabel,
} from "./useAuditLogColumns";

function formatDateLabel(dateStr?: string | Date): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "—" : format(d, "dd MMM yyyy");
  } catch {
    return "—";
  }
}

function formatTimeLabel(dateStr?: string | Date): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "" : format(d, "HH:mm:ss");
  } catch {
    return "";
  }
}

export interface AuditLogCardProps {
  log: AuditLogItem;
  showRightDivider?: boolean;
}

export function AuditLogCard({
  log,
  showRightDivider = false,
}: AuditLogCardProps) {
  const userName = log.user?.fullName || "System";
  const initial = userName.charAt(0).toUpperCase();

  return (
    <EntityCard
      showRightDivider={showRightDivider}
      avatar={
        <Avatar size="sm" className="size-11 border border-slate-200 shrink-0 bg-surface-primary-light">
          <AvatarFallback className="bg-surface-primary-light text-icon-primary font-bold text-base">
            {initial}
          </AvatarFallback>
        </Avatar>
      }
      title={log.entityType || "System Event"}
      subtitle={`${userName}${log.user?.email ? ` (${log.user.email})` : ""}`}
      headerBadge={
        <Badge
          variant="secondary"
          state={getActivityBadgeState(log.actionType)}
          className="px-2.5 py-0.5 shadow-none"
        >
          {getActivityBadgeLabel(log.actionType)}
        </Badge>
      }
      meta={[
        {
          icon: <Clock className="size-4 text-emerald-800 shrink-0" />,
          label: "Time",
          value: `${formatDateLabel(log.timestamp)} at ${formatTimeLabel(log.timestamp)}`,
        },
        {
          icon: <Monitor className="size-4 text-emerald-800 shrink-0" />,
          label: "Device",
          value: `${log.browser || "Browser"} • ${log.os || "OS"}`,
        },
        {
          icon: <MapPin className="size-4 text-emerald-800 shrink-0" />,
          label: "Location",
          value: log.locationName || log.ipAddress || "—",
        },
      ]}
      statusBadge={
        log.entityId ? (
          <Badge variant="secondary" state="inactive" className="font-mono px-2 py-0.5 shadow-none">
            {log.entityId.length > 10 ? `${log.entityId.substring(0, 10)}...` : log.entityId}
          </Badge>
        ) : undefined
      }
    />
  );
}

export interface AuditLogCardGridProps {
  logs?: AuditLogItem[];
  paginatedLogs: AuditLogItem[];
  isLoading: boolean;
}

export function AuditLogCardGrid({
  paginatedLogs,
}: AuditLogCardGridProps) {
  if (!paginatedLogs || paginatedLogs.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
      {paginatedLogs.map((log, idx) => (
        <AuditLogCard
          key={log.id}
          log={log}
          showRightDivider={
            idx % 3 !== 2 && idx !== paginatedLogs.length - 1
          }
        />
      ))}
    </div>
  );
}
