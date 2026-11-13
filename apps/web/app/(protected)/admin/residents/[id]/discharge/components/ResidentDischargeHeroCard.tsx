"use client";

import React from "react";
import { Calendar as CalendarIcon, Building2, Bed as BedIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Card } from "@repo/ui/components/ui";

interface ResidentDischargeHeroCardProps {
  resident: any;
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

function formatDate(dateString?: string) {
  if (!dateString) return "06 Mar, 2026";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function ResidentDischargeHeroCard({ resident }: ResidentDischargeHeroCardProps) {
  const residentName = resident?.fullName || "Devon Lane";
  const gender = resident?.profile?.gender || resident?.gender || "Female";
  const age = calculateAge(resident?.dob);
  const residentIdStr = resident?.nhsNumber ? `NHS: ${resident.nhsNumber}` : `Resident ID: ${resident?.id?.slice(-4) || "0005"}`;
  const admissionDateStr = formatDate(resident?.admissionDate || resident?.createdAt);
  const roomNumberStr = resident?.bed?.room?.roomNumber
    ? `Room ${resident.bed.room.roomNumber}`
    : "No room assigned";
  const bedNumberStr = resident?.bed?.number
    ? `Bed ${resident.bed.number}`
    : "No bed assigned";

  return (
    <Card className="p-6 bg-slate-50/80 border border-slate-200/80 rounded-2xl shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Avatar & Personal Details */}
        <div className="flex items-center gap-5">
          <Avatar className="size-20 lg:size-24 rounded-full border border-slate-200 shrink-0">
            {resident?.photoUrl && (
              <AvatarImage src={resident.photoUrl} alt={residentName} className="object-cover" />
            )}
            <AvatarFallback className="bg-amber-100 text-amber-900 font-bold text-xl lg:text-2xl">
              {getInitials(residentName)}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1">
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
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

        {/* Right: Key Info Badges */}
        <div className="flex flex-wrap items-center gap-6 lg:gap-8 pt-2 md:pt-0">
          {/* Admission Date */}
          <div className="flex items-center gap-3 border-l md:border-l border-slate-200 pl-4 lg:pl-6">
            <div className="size-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <CalendarIcon className="size-4" />
            </div>
            <div>
              <p className="text-md font-medium text-slate-500">Admission Date</p>
              <p className="text-md font-bold text-slate-900">{admissionDateStr}</p>
            </div>
          </div>

          {/* Room Number */}
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4 lg:pl-6">
            <div className="size-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <Building2 className="size-4" />
            </div>
            <div>
              <p className="text-md font-medium text-slate-500">Room Number</p>
              <p className="text-md font-bold text-slate-900">{roomNumberStr}</p>
            </div>
          </div>

          {/* Bed Number */}
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4 lg:pl-6">
            <div className="size-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <BedIcon className="size-4" />
            </div>
            <div>
              <p className="text-md font-medium text-slate-500">Bed Number</p>
              <p className="text-md font-bold text-slate-900">{bedNumberStr}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
