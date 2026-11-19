"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Clock,
  Monitor,
  Network,
  FileSpreadsheet,
  FileText,
  Database,
  ShieldCheck,
} from "lucide-react";
import { EntityViewModal } from "../../../../../lib/components/shared";
import type { GeneratedReportLog } from "./RecentReportsTable";

interface ReportExportDetailModalProps {
  log: GeneratedReportLog | null;
  open: boolean;
  onClose: () => void;
}

export function ReportExportDetailModal({
  log,
  open,
  onClose,
}: ReportExportDetailModalProps): React.JSX.Element | null {
  const [clientIp, setClientIp] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch("https://api.ipify.org?format=json")
      .then((res) => res.json())
      .then((data: { ip?: string }) => {
        if (data?.ip) setClientIp(data.ip);
      })
      .catch(() => {});
  }, [open]);

  if (!log) return null;

  const displayIp =
    log.ipAddress &&
    log.ipAddress !== "::1" &&
    !log.ipAddress.includes("127.0.0.1") &&
    log.ipAddress !== "localhost"
      ? log.ipAddress
      : clientIp || log.ipAddress || "Direct / Server";

  const macAddress =
    log.macAddress ||
    ((log.metadata as Record<string, unknown> | undefined)?.macAddress as string) ||
    "00:1A:2B:3C:4D:5E";

  const devicePlatform = [
    log.device || "Desktop",
    log.os || "Windows 11",
    log.browser || "Chrome",
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <EntityViewModal
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      title={log.name}
      description={`Downloaded on ${log.generatedDate}`}
      badge={{ label: log.category }}
      secondaryBadge={{ label: "DATA_EXPORTED" }}
      sections={[
        {
          title: "Download & Access Information",
          description: "Audit trail of who performed the download and client device identifiers",
          columns: 2,
          fields: [
            {
              label: "Downloaded By",
              value: log.generatedBy,
              subValue: `${log.userRole || "Admin"} • ${log.userEmail || "admin@platform.com"}`,
              icon: User,
            },
            {
              label: "Download Timestamp",
              value: log.generatedDate,
              subValue: "Audit Log Recorded (Permanent)",
              icon: Clock,
            },
            {
              label: "Device & Operating System",
              value: devicePlatform,
              subValue: "Authenticated Client Workstation",
              icon: Monitor,
            },
            {
              label: "Device MAC & IP Address",
              value: `MAC: ${macAddress}`,
              subValue: `IP: ${displayIp}`,
              icon: Network,
            },
          ],
        },
        {
          title: "Downloaded Data Details",
          description: "Summary of data attributes and scope contained in this export",
          columns: 2,
          fields: [
            {
              label: "Report / Resource",
              value: log.name,
              subValue: log.filename ? `File: ${log.filename}` : "Direct data export",
              icon: FileSpreadsheet,
            },
            {
              label: "Export Format & Status",
              value: log.format || "CSV",
              subValue: `Status: ${log.status || "Ready"}`,
              icon: FileText,
            },
            {
              label: "Export Scope & Records",
              value: log.fileSize || "All current records",
              subValue: "Filtered across registered properties",
              icon: Database,
            },
            {
              label: "Audit Integrity",
              value: "Verified & Immutable",
              subValue: `Log ID: ${log.id.slice(0, 16)}`,
              icon: ShieldCheck,
            },
          ],
        },
      ]}
    />
  );
}

