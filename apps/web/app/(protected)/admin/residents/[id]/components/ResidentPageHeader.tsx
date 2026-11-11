"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Edit2, LogOut, Printer } from "lucide-react";
import { Button } from "@repo/ui/components/ui";

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
      <div className="flex items-center gap-2 text-md font-medium text-slate-500">
        <button
          type="button"
          onClick={() => router.push(`/${roleBase}/residents`)}
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          <span>People Supported</span>
        </button>
        <span>›</span>
        <span className="font-bold text-slate-900">{fullName}</span>
      </div>

      {/* Right: Action Buttons (Print summary, SAR Export, Edit Profile & Discharge) */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        <Button
          type="button"
          variant="outline"
          onClick={() => typeof window !== "undefined" && window.print()}
          className="h-10 rounded-xl border-slate-200 bg-white px-3.5 text-md font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
        >
          <Printer className="size-3.5 text-slate-700" />
          <span>Print summary</span>
        </Button>

        {onExportSarClick && (
          <Button
            type="button"
            variant="outline"
            disabled={isExportingSar}
            onClick={onExportSarClick}
            className="h-10 rounded-xl border-slate-200 bg-white px-3.5 text-md font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
          >
            <Download className="size-3.5 text-slate-700" />
            <span>{isExportingSar ? "Exporting SAR…" : "Export SAR"}</span>
          </Button>
        )}

        {onEditClick && (
          <Button
            type="button"
            variant="primary"
            onClick={onEditClick}
            className="h-10 rounded-xl px-3.5 text-md font-semibold inline-flex items-center gap-1.5"
          >
            <Edit2 className="size-3.5 text-white" />
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
              className="rounded-xl h-10 px-3.5 text-md font-semibold inline-flex items-center gap-1.5"
            >
              <LogOut className="size-3.5 text-white" />
              <span>Discharge</span>
            </Button>
          )}
      </div>
    </div>
  );
}
