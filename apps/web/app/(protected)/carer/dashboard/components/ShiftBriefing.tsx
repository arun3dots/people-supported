"use client";

import React from "react";
import { Bell, Info, MessageSquare, ArrowRight, Clock, ShieldAlert } from "lucide-react";
import { Card, Button, Badge } from "@repo/ui/components/ui";
import { useGetActiveShiftQuery, useGetShiftDetailsQuery } from "../../../../../lib/queries/shifts";
import Link from "next/link";
import { formatUkTime } from "../../../../../lib/utils/uk-date-time";

export function ShiftBriefing() {
  const { data: activeShiftData, isLoading } = useGetActiveShiftQuery();
  const currentShift = activeShiftData?.active || activeShiftData?.next;
  const shiftId = currentShift?.id || "";

  const { data: shiftDetails } = useGetShiftDetailsQuery(shiftId, {
    enabled: Boolean(shiftId),
  });

  const previousHandover = shiftDetails?.previousShiftHandover;
  const shiftNotes = shiftDetails?.shiftNotes;
  const incidentCount = shiftDetails?.incidentCount || 0;

  return (
    <Card className="p-6 sm:p-8 h-full bg-slate-50/70 border border-slate-200/80 rounded-2xl flex flex-col justify-between gap-6 shadow-xs font-sans">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/70 mb-4 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#3D5C57] shrink-0">
              <Bell className="size-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Shift Briefing
              </h3>
              <p className="text-md text-slate-500 font-medium">
                Active clinical handover &amp; notes
              </p>
            </div>
          </div>
          <span className="text-md font-semibold px-2.5 py-1 rounded-full bg-emerald-100/70 text-emerald-800 border border-emerald-200 whitespace-nowrap shrink-0">
            {currentShift ? (activeShiftData?.active ? "Active Shift" : "Next Shift") : "Off Duty"}
          </span>
        </div>

        {/* Briefing Items */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-16 animate-pulse bg-white rounded-xl" />
              <div className="h-16 animate-pulse bg-white rounded-xl" />
            </div>
          ) : currentShift ? (
            <>
              {/* Previous Shift Handover Note */}
              <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-md font-bold tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                    Clinical Handover
                  </span>
                  <span className="text-md font-semibold text-slate-400">
                    {previousHandover?.shiftName || "Preceding Shift"}
                  </span>
                </div>
                <h5 className="font-bold text-md text-slate-900">
                  Outgoing Team Notes
                </h5>
                <p className="text-md text-slate-600 leading-relaxed italic">
                  {previousHandover?.handoverNotes
                    ? `"${previousHandover.handoverNotes}"`
                    : "No specific handover alerts recorded from previous shift."}
                </p>
              </div>

              {/* Shift Notes / Facility Alert */}
              <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-md font-bold tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    Shift Instructions
                  </span>
                  <span className="text-md font-semibold text-slate-400">
                    {currentShift.wardName || "Main Facility"}
                  </span>
                </div>
                <h5 className="font-bold text-md text-slate-900">
                  {currentShift.name || currentShift.type?.name || "Shift"} (
                  {formatUkTime(currentShift.startTime)}{" "}
                  -{" "}
                  {formatUkTime(currentShift.endTime)}
                  )
                </h5>
                <p className="text-md text-slate-600 leading-relaxed">
                  {shiftNotes || "Standard shift duties apply. Monitor assigned residents and complete scheduled care plan tasks."}
                </p>
                {incidentCount > 0 && (
                  <div className="flex items-center gap-1.5 text-md font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-md border border-rose-200 mt-1">
                    <ShieldAlert className="size-3" />
                    <span>{incidentCount} clinical incident(s) flagged during this period</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200/80 space-y-2">
              <Clock className="size-6 text-slate-400 mx-auto" />
              <p className="text-md font-bold text-slate-700">No Shift Currently Scheduled</p>
              <p className="text-md text-slate-500">
                Check your weekly rota for upcoming scheduled duty.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="pt-4 border-t border-slate-200/70">
        <Link href="/carer/rota" className="w-full block">
          <Button
            type="button"
            className="w-full h-11 rounded-xl bg-[#3D5C57] hover:bg-[#2D4541] text-white font-bold text-md shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <MessageSquare className="size-3.5" />
            View Full Rota &amp; Shift Tasks
            <ArrowRight className="size-3.5" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
