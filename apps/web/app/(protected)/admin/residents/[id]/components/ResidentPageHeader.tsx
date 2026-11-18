"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Edit2, LogOut } from "lucide-react";
import { Button, Text } from "@repo/ui/components/ui";

interface ResidentSummary {
  id?: string;
  fullName?: string;
  isDraft?: boolean;
  status?: string;
}

interface ResidentPageHeaderProps {
  resident: ResidentSummary | null | undefined;
  roleBase: string;
  onEditClick?: () => void;
  onDischargeClick?: () => void;
  onExportSarClick?: () => void;
  isExportingSar?: boolean;
}

export function ResidentPageHeader({
  resident,
  roleBase,
  onEditClick,
  onDischargeClick,
  onExportSarClick,
  isExportingSar = false,
}: ResidentPageHeaderProps) {
  const router = useRouter();
  const fullName = resident?.fullName?.trim() || "Person Supported";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 lg:gap-6 font-sans">
      {/* Left: Breadcrumb Back Link */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push(`/${roleBase}/residents`)}
          className="inline-flex items-center gap-1.5 text-md text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          <Text as="span" size="md" variant="muted">
            People Supported
          </Text>
        </button>
        <Text as="span" size="md" variant="muted">
          ›
        </Text>
        <Text as="span" size="md" weight="medium" className="text-slate-900">
          {fullName}
        </Text>
      </div>

      {/* Right: Action Buttons (SAR Export, Edit Profile & Discharge) */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        {onExportSarClick && (
          <Button
            type="button"
            variant="outline"
            disabled={isExportingSar}
            onClick={onExportSarClick}
            className="h-10 rounded-xl px-3.5 text-md inline-flex items-center gap-1.5"
          >
            <Download className="size-3.5" />
            <span>{isExportingSar ? "Exporting SAR…" : "Export SAR"}</span>
          </Button>
        )}

        {onEditClick && (
          <Button
            type="button"
            variant="primary"
            onClick={onEditClick}
            className="h-10 rounded-xl px-3.5 text-md inline-flex items-center gap-1.5"
          >
            <Edit2 className="size-3.5" />
            <span>Edit Admission</span>
          </Button>
        )}

        {onDischargeClick &&
          !resident?.isDraft &&
          resident?.status === "Active" && (
            <Button
              type="button"
              variant="destructive"
              onClick={onDischargeClick}
              className="rounded-xl h-10 px-3.5 text-md inline-flex items-center gap-1.5"
            >
              <LogOut className="size-3.5" />
              <span>Discharge</span>
            </Button>
          )}
      </div>
    </div>
  );
}
