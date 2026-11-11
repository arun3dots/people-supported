"use client";

import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, ChevronLeft, ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/Dialog";
import { Button } from "@repo/ui/components/ui/Button";
import { Textarea } from "@repo/ui/components/ui/Textarea";
import { SelectedResidentItem } from "./AssignResidentModal";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface ReviewResidentAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffName?: string;
  staffRole?: string;
  staffAvatar?: string;
  compliancePercent?: number;
  maxCapacity?: number;
  currentResidents?: number;
  remainingCapacity?: number;
  selectedResidents?: SelectedResidentItem[];
  onBackToSelection: () => void;
  onConfirmOverride: (reason: string, notifyManager: boolean, flagCompliance: boolean) => void;
  isPending?: boolean;
}

export function ReviewResidentAssignmentModal({
  isOpen,
  onClose,
  staffName = "Staff Member",
  staffRole = "Care Assistant",
  staffAvatar,
  compliancePercent = 93,
  maxCapacity = 7,
  currentResidents = 0,
  remainingCapacity = 7,
  selectedResidents = [],
  onBackToSelection,
  onConfirmOverride,
  isPending = false,
}: ReviewResidentAssignmentModalProps) {
  const [overrideReason, setOverrideReason] = useState("");
  const [notifyManager, setNotifyManager] = useState(true);
  const [flagCompliance, setFlagCompliance] = useState(true);

  if (!isOpen) return null;

  // Compute real stats from selected residents
  const readyCount = selectedResidents.filter((r) => r.overview === "Recommended").length;
  const reviewCount = selectedResidents.filter((r) => r.overview === "Assign Anyway").length;
  const notMatchingCount = selectedResidents.filter((r) => r.overview === "Risk Involved").length;
  const newTotal = currentResidents + selectedResidents.length;
  const capacityPercent = maxCapacity > 0 ? Math.round((newTotal / maxCapacity) * 100) : 0;
  const hasRisk = notMatchingCount > 0 || reviewCount > 0;
  const riskLevel = notMatchingCount > 0 ? "High" : reviewCount > 0 ? "Medium" : "Low";

  const handleConfirm = () => {
    onConfirmOverride(overrideReason, notifyManager, flagCompliance);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="2xl" className="flex flex-col">
        {/* Header */}
        <DialogHeader className="border-b pb-4 border-slate-100 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Review Resident Assignment
            </DialogTitle>
            <p className="text-md text-slate-500 font-medium mt-0.5">
              Review competency validation before assigning {selectedResidents.length} resident{selectedResidents.length !== 1 ? "s" : ""} to {staffName}
            </p>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-5 py-4 pr-1">
          {/* Staff Profile Header Card */}
          <div className="bg-[#F9FAFB] border border-slate-100 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-full overflow-hidden bg-gradient-to-br from-emerald-400 to-teal-600 shrink-0 border border-slate-200 flex items-center justify-center text-white font-bold text-md">
                {staffAvatar ? (

                  <img src={staffAvatar} alt={staffName} className="object-cover size-full" />
                ) : (
                  getInitials(staffName)
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">{staffName}</h4>
                <p className="text-md text-slate-500 font-medium">{staffRole}</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {selectedResidents.length} resident{selectedResidents.length !== 1 ? "s" : ""} selected
                </p>
              </div>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-6 border-l border-slate-200 pl-6">
              <div className="flex items-center gap-2">
                <div className="relative size-10 flex items-center justify-center">
                  <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" className="stroke-slate-200" strokeWidth="3" fill="transparent" />
                    <circle cx="18" cy="18" r="14" className="stroke-[#3D5C57]" strokeWidth="3"
                      strokeDasharray={`${(compliancePercent / 100) * 87.96} 87.96`}
                      strokeLinecap="round" fill="transparent" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-800">{compliancePercent}%</span>
                </div>
                <div className="text-[11px] font-semibold text-slate-600">Compliance</div>
              </div>

              <div className="text-center border-l border-slate-200 pl-6">
                <div className="text-[11px] font-medium text-slate-500">Max Capacity</div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">{maxCapacity.toString().padStart(2, '0')}</div>
              </div>

              <div className="text-center border-l border-slate-200 pl-6">
                <div className="text-[11px] font-medium text-slate-500">After Assign</div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">{newTotal.toString().padStart(2, '0')}</div>
              </div>

              <div className="text-center border-l border-slate-200 pl-6">
                <div className="text-[11px] font-medium text-slate-500">Remaining</div>
                <div className={`text-lg font-bold mt-0.5 ${Math.max(0, maxCapacity - newTotal) === 0 ? "text-red-600" : "text-slate-900"}`}>
                  {Math.max(0, maxCapacity - newTotal).toString().padStart(2, '0')}
                </div>
              </div>
            </div>
          </div>

          {/* 4 Cards Row — real computed counts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Ready to Assign */}
            <div className="border border-emerald-300 bg-emerald-50/20 rounded-2xl p-4 space-y-3">
              <div className="size-8 rounded-full bg-emerald-100 text-[#3D5C57] flex items-center justify-center">
                <CheckCircle2 className="size-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">
                  {String(readyCount).padStart(2, '0')}{" "}
                  <span className="text-md font-semibold text-[#3D5C57]">Ready to Assign</span>
                </div>
                <div className="text-[11px] font-medium text-slate-500 mt-0.5">All competencies met</div>
              </div>
            </div>

            {/* Card 2: Requires Review */}
            <div className="border border-amber-300 bg-amber-50/20 rounded-2xl p-4 space-y-3">
              <div className="size-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="size-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">
                  {String(reviewCount).padStart(2, '0')}{" "}
                  <span className="text-md font-semibold text-amber-700">Requires Review</span>
                </div>
                <div className="text-[11px] font-medium text-slate-500 mt-0.5">Partial competency match</div>
              </div>
            </div>

            {/* Card 3: Not Matching */}
            <div className="border border-red-300 bg-red-50/20 rounded-2xl p-4 space-y-3">
              <div className="size-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                <XCircle className="size-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">
                  {String(notMatchingCount).padStart(2, '0')}{" "}
                  <span className="text-md font-semibold text-red-600">Not Matching</span>
                </div>
                <div className="text-[11px] font-medium text-slate-500 mt-0.5">Missing mandatory skills</div>
              </div>
            </div>

            {/* Card 4: Capacity Impact */}
            <div className="border border-slate-200 bg-slate-50/50 rounded-2xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="text-md font-bold text-slate-900">Capacity Impact</div>
                <div className="flex items-center justify-between text-[11px] mt-1">
                  <span className="font-bold text-slate-900">{newTotal}/{maxCapacity}</span>
                  <span className="text-slate-500">{Math.max(0, maxCapacity - newTotal)} Remaining</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden mt-1.5">
                  <div
                    className={`h-full rounded-full ${capacityPercent >= 100 ? "bg-red-500" : capacityPercent >= 85 ? "bg-amber-500" : "bg-[#3D5C57]"}`}
                    style={{ width: `${Math.min(100, capacityPercent)}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-1">After Assignment</div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
                <span className="text-[11px] font-semibold text-slate-600">Overall Risk Level</span>
                <span className={`px-2.5 py-1 rounded-lg text-white text-[10px] font-bold flex items-center gap-1 ${riskLevel === "High" ? "bg-red-500" : riskLevel === "Medium" ? "bg-amber-500" : "bg-emerald-600"
                  }`}>
                  <ShieldAlert className="size-3" /> {riskLevel}
                </span>
              </div>
            </div>
          </div>

          {/* Warning Box & Override Form — shown only when there are risk items */}
          {hasRisk && (
            <div className="border border-amber-200/80 bg-amber-50/40 rounded-2xl p-5 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-md font-medium text-slate-700 leading-relaxed">
                  One or more residents have competency gaps. Assigning {staffName} despite the mismatch requires a manager justification.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-md font-bold text-slate-900">
                  Reason for override.<span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value.slice(0, 250))}
                  placeholder="Provide reason for assigning despite mismatch"
                  className="bg-white border-slate-200 rounded-2xl text-md p-4 min-h-[100px] shadow-2xs focus:ring-[#3D5C57] resize-none"
                />
                <div className="text-[11px] text-slate-400 text-right font-medium">
                  {overrideReason.length}/250
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-1">
                <label className="flex items-center gap-2 text-md font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyManager}
                    onChange={(e) => setNotifyManager(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 size-4 accent-emerald-600 cursor-pointer"
                  />
                  <span>Notify Manager</span>
                </label>

                <label className="flex items-center gap-2 text-md font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={flagCompliance}
                    onChange={(e) => setFlagCompliance(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 size-4 accent-emerald-600 cursor-pointer"
                  />
                  <span>Flag in compliance report</span>
                </label>
              </div>
            </div>
          )}

          {/* Selected Residents Summary */}
          {selectedResidents.length > 0 && (
            <div className="space-y-2">
              <div className="text-md font-bold text-slate-600  tracking-wider">Selected Residents</div>
              <div className="flex flex-wrap gap-2">
                {selectedResidents.map((r) => (
                  <div key={r.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-md font-semibold text-slate-700">
                    <span>{r.name}</span>
                    <span className={`text-[10px] font-bold ${r.overview === "Recommended" ? "text-emerald-600" :
                      r.overview === "Assign Anyway" ? "text-amber-600" : "text-red-500"
                      }`}>
                      • {r.overview}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t pt-4 border-slate-100 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackToSelection}
            className="px-5 py-2.5 rounded-full border border-slate-300 text-slate-700 bg-white text-md font-bold hover:bg-slate-50 flex items-center gap-1.5"
          >
            <ChevronLeft className="size-4 text-slate-500" />
            <span>Back to Selection</span>
          </button>

          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || (hasRisk && !overrideReason.trim())}
            className={`px-8 py-3 rounded-xl text-white text-md font-bold shadow-md disabled:opacity-50 ${hasRisk ? "bg-[#C28E00] hover:bg-[#B45309]" : "bg-[#3D5C57] hover:bg-[#2D4541]"
              }`}
          >
            {isPending
              ? "Assigning…"
              : hasRisk
                ? "Assign with Override"
                : "Confirm Assignment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
