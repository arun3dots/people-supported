"use client";

import React from "react";
import { Sun, Calendar, Clock } from "lucide-react";

interface ShiftSummaryCardProps {
  shiftName?: string;
  dateStr?: string;
  timeRange?: string;
  coveragePercent?: number;
  totalResidents?: number;
  assignedResidents?: number;
  unassignedResidents?: number;
  staffsRequired?: number;
  staffScheduled?: number;
}

export function ShiftSummaryCard({
  shiftName = "Morning Shift",
  dateStr = "Tuesday, 20 July 2026",
  timeRange = "06:00 - 15:00",
  coveragePercent = 93,
  totalResidents = 18,
  assignedResidents = 14,
  unassignedResidents = 4,
  staffsRequired = 10,
  staffScheduled = 9,
}: ShiftSummaryCardProps) {
  // Circular gauge calculations
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (coveragePercent / 100) * circumference;

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left Section: Shift Info */}
        <div className="md:col-span-4 flex items-center gap-4 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-6">
          <div className="size-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 border border-amber-200/60 shadow-xs">
            <Sun className="size-7 stroke-[1.8]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">{shiftName}</h2>
            <p className="text-md font-medium text-slate-500 mt-0.5">{dateStr}</p>
            <div className="flex items-center gap-1.5 text-md font-semibold text-slate-600 mt-1">
              <Clock className="size-3.5 text-slate-400" />
              <span>{timeRange}</span>
            </div>
          </div>
        </div>

        {/* Middle Section: Coverage Radial Gauge */}
        <div className="md:col-span-3 flex items-center justify-center border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:px-4">
          <div className="flex items-center gap-3">
            <div className="relative size-20 flex items-center justify-center">
              <svg className="size-full -rotate-90" viewBox="0 0 80 80">
                {/* Background track */}
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className="stroke-slate-100"
                  strokeWidth="7"
                  fill="transparent"
                />
                {/* Progress track */}
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className="stroke-[#3D5C57] transition-all duration-700 ease-out"
                  strokeWidth="7"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-md font-extrabold text-slate-900 leading-none">{coveragePercent}%</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-md font-bold text-slate-900">Coverage</span>
              <span className="text-md font-medium text-emerald-600 mt-0.5">Optimal status</span>
            </div>
          </div>
        </div>

        {/* Right Section: Key Metrics */}
        <div className="md:col-span-5 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center sm:text-left">
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">{totalResidents.toString().padStart(2, '0')}</span>
            <span className="text-md font-medium text-slate-500 mt-0.5">Residents</span>
          </div>

          <div className="flex flex-col sm:border-l sm:border-gray-100 sm:pl-3">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">{assignedResidents.toString().padStart(2, '0')}</span>
            <span className="text-md font-medium text-slate-500 mt-0.5">Assigned</span>
          </div>

          <div className="flex flex-col sm:border-l sm:border-gray-100 sm:pl-3">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">{unassignedResidents.toString().padStart(2, '0')}</span>
            <span className="text-md font-medium text-slate-500 mt-0.5">Unassigned</span>
          </div>

          <div className="flex flex-col sm:border-l sm:border-gray-100 sm:pl-3">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">{staffsRequired.toString().padStart(2, '0')}</span>
            <span className="text-md font-medium text-slate-500 mt-0.5">Staff Required</span>
          </div>

          <div className="flex flex-col sm:border-l sm:border-gray-100 sm:pl-3">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">{staffScheduled.toString().padStart(2, '0')}</span>
            <span className="text-md font-medium text-slate-500 mt-0.5">Staff Scheduled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
