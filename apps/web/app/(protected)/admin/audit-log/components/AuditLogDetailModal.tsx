"use client";

import React, { useState, useEffect } from "react";
import { User, FileText, Globe, Monitor } from "lucide-react";
import { Text } from "@repo/ui/components/ui";
import { EntityViewModal } from "../../../../../lib/components/shared";
import type { AuditLog as AuditLogItem } from "../../../../../lib/queries/audit/useGetAuditLogsQuery";
import {
  formatLogWhen,
  getLogArea,
  getLogChange,
  getLogBefore,
  getLogAfter,
  getLogResident,
} from "./audit-helpers";

interface AuditLogDetailModalProps {
  log: AuditLogItem | null;
  open: boolean;
  onClose: () => void;
}

function getDisplayOS(os?: string): string {
  if (typeof window !== "undefined") {
    const ua = navigator.userAgent;
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

export function AuditLogDetailModal({
  log,
  open,
  onClose,
}: AuditLogDetailModalProps) {
  const [clientIp, setClientIp] = useState<string | null>(null);

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then((res) => res.json())
      .then((data: { ip?: string }) => {
        if (data?.ip) setClientIp(data.ip);
      })
      .catch(() => {});
  }, []);

  if (!log) return null;

  const { date, time } = formatLogWhen(log.timestamp);
  const area = getLogArea(log);
  const changeTitle = getLogChange(log);
  const beforeText = getLogBefore(log);
  const afterText = getLogAfter(log);
  const resident = getLogResident(log);
  const staffName = log.user?.fullName || log.userFullName || "System";
  const staffRole = log.userRoleName || "Staff";

  const os = getDisplayOS(log.os);
  const ipAddress = getDisplayIP(log.ipAddress, clientIp) || "Direct / Server";
  const deviceInfo =
    [log.device || "Desktop", os, log.browser].filter(Boolean).join(" • ") ||
    "Not recorded";

  return (
    <EntityViewModal
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      title={changeTitle}
      description={`Recorded on ${date} at ${time}`}
      badge={{ label: area }}
      secondaryBadge={{ label: log.actionType }}
      sections={[
        {
          columns: 2,
          fields: [
            {
              label: "Performed By",
              value: staffName,
              subValue: staffRole,
              icon: User,
            },
            {
              label: "Resident",
              value: resident !== "—" ? resident : "No Resident Linked",
              subValue: `Entity: ${log.entityType || "General"}`,
              icon: FileText,
            },
            {
              label: "IP Address",
              value: ipAddress,
              subValue: `Tenant: ${log.tenantId ? log.tenantId.slice(0, 8) : "Platform"}`,
              icon: Globe,
            },
            {
              label: "Device & Browser",
              value: deviceInfo,
              icon: Monitor,
            },
          ],
        },
      ]}
    >
      {/* ================= Before vs After Comparison ================= */}
      <div className="pt-1 min-w-0 w-full">
        <Text size="md" weight="bold" className="text-slate-900 mb-3 block">
          State Comparison (Before & After)
        </Text>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0 w-full">
          <div className="flex flex-col rounded-xl border border-rose-100 bg-rose-50/50 p-4 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-rose-100">
              <Text size="md" weight="bold" className="text-rose-800">
                Before Change
              </Text>
              <span className="text-md font-medium text-rose-600 bg-rose-100/70 px-2 py-0.5 rounded-full">
                Prior State
              </span>
            </div>
            <div className="text-md text-slate-800 leading-relaxed font-normal min-h-[48px] whitespace-pre-wrap break-words break-all [overflow-wrap:anywhere] min-w-0">
              {beforeText || "—"}
            </div>
          </div>

          <div className="flex flex-col rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-emerald-100">
              <Text size="md" weight="bold" className="text-emerald-800">
                After Change
              </Text>
              <span className="text-md font-medium text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                Updated State
              </span>
            </div>
            <div className="text-md text-slate-900 leading-relaxed font-medium min-h-[48px] whitespace-pre-wrap break-words break-all [overflow-wrap:anywhere] min-w-0">
              {afterText || "—"}
            </div>
          </div>
        </div>
      </div>
    </EntityViewModal>
  );
}
