"use client";

import React from "react";
import { Building2, Bed as BedIcon, Loader2 } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui";
import { DischargeFormData } from "./DischargeFormSections";

interface DischargeReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resident: any;
  formData: DischargeFormData;
  onConfirm: () => void;
  isLoading?: boolean;
}

function getInitials(name?: string) {
  if (!name) return "DL";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function calculateAge(dobString?: string) {
  if (!dobString) return "78";
  try {
    const birthDate = new Date(dobString);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      years--;
    }
    return isNaN(years) ? "78" : String(years);
  } catch {
    return "78";
  }
}

function formatReadableDateTime(dateStr?: string, timeStr?: string) {
  if (!dateStr) return "12 August 2026, 11:20 AM";
  try {
    const d = new Date(dateStr);
    const dateFormatted = isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    return timeStr ? `${dateFormatted}, ${timeStr}` : dateFormatted;
  } catch {
    return `${dateStr}, ${timeStr || ""}`;
  }
}

export function DischargeReviewModal({
  open,
  onOpenChange,
  resident,
  formData,
  onConfirm,
  isLoading,
}: DischargeReviewModalProps) {
  const residentName = resident?.fullName || "Devon Lane";
  const gender = resident?.profile?.gender || resident?.gender || "Female";
  const age = calculateAge(resident?.dob);
  const residentIdStr = resident?.nhsNumber ? `NHS: ${resident.nhsNumber}` : `Resident ID: ${resident?.id?.slice(-4) || "0005"}`;
  const roomNumberStr = resident?.bed?.room?.roomNumber ? `Room ${resident.bed.room.roomNumber}` : "Room 102";
  const bedNumberStr = resident?.bed?.number ? `Bed ${resident.bed.number}` : "Bed A";

  const rows = [
    { label: "Reason for Discharge", value: formData.reason || "Moving to another care home" },
    { label: "Discharge Type", value: formData.dischargeType || "Planned" },
    {
      label: "Discharge Date & Time",
      value: formatReadableDateTime(formData.dischargeDate, formData.dischargeTime),
    },
    { label: "Care Plan Review", value: formData.carePlanReview || "Completed" },
    { label: "Risk Assessment", value: formData.riskAssessment || "Low Risk" },
    { label: "Medication Review", value: formData.medicationReview || "Completed" },
    { label: "Family Notified", value: formData.familyNotified ? "Yes" : "No" },
    { label: "GP Notified", value: formData.gpNotified ? "Yes" : "No" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Review & Confirm Resident Discharge</DialogTitle>
        </DialogHeader>

        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <Avatar className="size-16 sm:size-20 rounded-full border border-slate-200 shrink-0">
              {resident?.photoUrl && (
                <AvatarImage src={resident.photoUrl} alt={residentName} className="object-cover" />
              )}
              <AvatarFallback className="bg-amber-100 text-amber-900 font-bold text-lg sm:text-xl">
                {getInitials(residentName)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-0.5">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {residentName}
              </h2>
              <div className="flex items-center gap-2 text-md font-medium text-slate-500">
                <span>{gender}</span>
                <span>|</span>
                <span>{age} years</span>
              </div>
              <p className="text-md font-semibold text-slate-600">
                {residentIdStr}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:border-l sm:border-slate-200 sm:pl-5">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
                <Building2 className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Room Number</p>
                <p className="text-md font-bold text-slate-900">{roomNumberStr}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
                <BedIcon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Bed Number</p>
                <p className="text-md font-bold text-slate-900">{bedNumberStr}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Review Card */}
        <div className="bg-[#F8F9FA] rounded-2xl p-5 sm:p-6 space-y-4 border border-slate-100">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-md sm:text-md"
            >
              <span className="sm:col-span-5 font-semibold text-slate-900">
                {row.label}
              </span>
              <span className="sm:col-span-7 font-medium text-slate-600">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="h-11 px-7 bg-white border border-slate-300 text-slate-900 font-bold rounded-xl text-md sm:text-md hover:bg-slate-50 cursor-pointer"
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="h-11 px-7 bg-[#3D5C57] hover:bg-[#2D4541] text-white font-bold rounded-xl text-md sm:text-md shadow-xs transition-colors cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" /> Completing...
              </>
            ) : (
              "Complete Discharge"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
