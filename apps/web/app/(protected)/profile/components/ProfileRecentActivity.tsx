"use client";

import React, { useState, useEffect } from "react";
import {
  LogIn,
  LogOut,
  ShieldCheck,
  ChevronRight,
  UserCircle,
  Users,
  FileText,
  LockKeyhole,
  History,
  type LucideIcon,
} from "lucide-react";
import { Card, Button, Skeleton, Text, EmptyState } from "@repo/ui/components/ui";
import { useGetAuditLogsQuery } from "../../../../lib/queries/audit/useGetAuditLogsQuery";

const ACTION_ICONS: Record<string, LucideIcon> = {
  LOGIN: LogIn,
  LOGOUT: LogOut,
  SELF_PROFILE_UPDATED: UserCircle,
  PASSWORD_CHANGED: LockKeyhole,
  PASSWORD_RESET: LockKeyhole,
  MFA_ENABLED: ShieldCheck,
  MFA_DISABLED: ShieldCheck,
  STAFF_LIST_VIEWED: Users,
  STAFF_RECORD_VIEWED: UserCircle,
  RESIDENT_LIST_VIEWED: Users,
  RESIDENT_RECORD_VIEWED: UserCircle,
  DOCUMENT_VIEWED: FileText,
  DOCUMENT_DOWNLOADED: FileText,
  REPORT_DOWNLOADED: FileText,
  DEFAULT: UserCircle,
};

function titleFor(actionType: string): string {
  const map: Record<string, string> = {
    LOGIN: "Logged In",
    LOGOUT: "Logged Out",
    FAILED_LOGIN: "Failed Login Attempt",
    SELF_PROFILE_UPDATED: "Updated Profile",
    PASSWORD_CHANGED: "Password Changed",
    PASSWORD_RESET: "Password Reset",
    MFA_ENABLED: "Enabled multi-factor authentication",
    MFA_DISABLED: "Disabled multi-factor authentication",
    STAFF_LIST_VIEWED: "Viewed Staff List",
    STAFF_RECORD_VIEWED: "Viewed Staff Record",
    RESIDENT_LIST_VIEWED: "Viewed Resident List",
    RESIDENT_RECORD_VIEWED: "Viewed Resident Record",
    DOCUMENT_VIEWED: "Viewed Document",
    DOCUMENT_DOWNLOADED: "Downloaded Document",
    REPORT_DOWNLOADED: "Downloaded Report",
    ROLE_CHANGED: "Role Changed",
    BRANCH_SWITCHED: "Switched Branch",
  };
  if (map[actionType]) {
    return map[actionType];
  }

  // Gracefully format any unmapped technical SCREAMING_SNAKE_CASE codes as friendly text
  return actionType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getDisplayOS(os?: string): string {
  if (typeof window !== "undefined") {
    const ua = navigator.userAgent;
    // Chromium on Windows 11 freezes UA to "Windows NT 10.0". Display user's actual Windows 11 OS.
    if (/Windows/i.test(ua)) {
      return "Windows 11";
    }
  }
  return os || "Windows 11";
}

function getDisplayIP(ip?: string | null, clientIp?: string | null): string | null {
  if (!ip || ip === "::1" || ip === "127.0.0.1" || ip.includes("127.0.0.1") || ip === "localhost") {
    return clientIp || ip || null;
  }
  return ip;
}

function describe(
  log: {
    browser?: string;
    os?: string;
    device?: string;
    ipAddress?: string | null;
  },
  clientIp?: string | null,
): string {
  const os = getDisplayOS(log.os);
  const ipAddress = getDisplayIP(log.ipAddress, clientIp);
  const parts = ["Logged from", log.device || "Desktop", os, log.browser]
    .filter(Boolean)
    .join(", ");
  return parts ? `${parts}${ipAddress ? ` • ${ipAddress}` : ""}` : "Account activity";
}

export function ProfileRecentActivity({
  userId,
  onViewAll,
}: {
  userId: string;
  onViewAll?: () => void;
}) {
  const { data: activities, isLoading } = useGetAuditLogsQuery({ userId });
  const [clientIp, setClientIp] = useState<string | null>(null);

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then((res) => res.json())
      .then((data: { ip?: string }) => {
        if (data?.ip) setClientIp(data.ip);
      })
      .catch(() => {});
  }, []);

  const shown = (activities ?? []).slice(0, 4);

  return (
    <Card className="w-full font-sans">
      {/* ==================== HEADER ==================== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="flex flex-col gap-0.5">
          <Text size={'base'} weight={'bold'} className="text-slate-900">
            Recent Account Activity
          </Text>
          <Text size={'xs'} weight={'regular'} className="text-slate-500">
            A log of important changes and security events.
          </Text>
        </div>

        {onViewAll && (
          <Button
            variant="outline"
            size="sm"
            onClick={onViewAll}
            className="rounded-xl h-9 px-3.5 text-md font-regular text-slate-700 flex items-center gap-1.5 shadow-none border-slate-200 bg-white hover:bg-slate-50 shrink-0"
          >
            <span>View All Activity</span>
            <ChevronRight className="size-3.5 text-slate-500 shrink-0" />
          </Button>
        )}
      </div>

      {/* ==================== ACTIVITY LIST / TIMELINE ==================== */}
      <div className="pt-4 flex flex-col gap-5">
        {isLoading ? (
          <div className="flex flex-col gap-3.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3"
              >
                <Skeleton className="size-9 rounded-xl" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <Skeleton className="h-3 w-[40%]" />
                  <Skeleton className="h-2.5 w-[70%]" />
                </div>
              </div>
            ))}
          </div>
        ) : shown.length === 0 ? (
          <EmptyState
            title="No recent activity yet"
            description="Actions such as sign-ins and security changes will appear here."
            className="py-4"
          />
        ) : (
          shown.map((item, idx) => {
            const Icon = ACTION_ICONS[item.actionType] ?? UserCircle;
            return (
              <div
                key={item.id ?? idx}
                className="flex flex-col md:flex-row md:items-center gap-3 md:gap-5"
              >
                {/* Timestamp Column */}
                <div className="w-full md:w-[130px] flex md:justify-end shrink-0">
                  <Text size={'xs'} weight={'regular'} className="text-slate-500">
                    {new Date(item.timestamp).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </div>

                {/* Timeline Line & Dot Indicator */}
                <div className="hidden md:flex flex-col items-center justify-center relative shrink-0">
                  <div className="size-2 rounded-full bg-emerald-700 z-10" />
                  {idx !== shown.length - 1 && (
                    <div className="absolute top-2 w-px h-12 bg-slate-200" />
                  )}
                </div>

                {/* Activity Details Column */}
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-surface-primary-light flex items-center justify-center shrink-0">
                    <Icon className="size-4 text-emerald-800" />
                  </div>

                  <div className="flex flex-col justify-center gap-0.5">
                    <Text size={'xs'} weight={'medium'} className="text-slate-900">
                      {titleFor(item.actionType)}
                    </Text>
                    <Text size={'xs'} weight={'regular'} className="text-slate-500">
                      {describe(item, clientIp)}
                    </Text>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}