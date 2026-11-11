"use client";

import React from "react";
import { differenceInHours, differenceInMinutes } from "date-fns";
import { Calendar, Clock, ArrowRight, Building2 } from "lucide-react";
import { Card, Button, Badge, Skeleton } from "@repo/ui/components/ui";
import { useGetMyShiftsQuery } from "../../../../lib/queries/shifts";
import { ShiftExecutionModal } from "../../../../lib/components/staff/ShiftExecutionModal";
import { Shift } from "../../../../lib/types/shifts";
import { formatUkDate, formatUkTime } from "../../../../lib/utils/uk-date-time";

export default function ShiftHistoryPage() {
  const [selectedShift, setSelectedShift] = React.useState<Shift | null>(null);
  const { data: shifts, isLoading } = useGetMyShiftsQuery({});

  const calculateDuration = (startTime: string | Date, endTime: string | Date) => {
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const hours = differenceInHours(end, start);
      const mins = differenceInMinutes(end, start) % 60;
      return `${hours}h ${mins > 0 ? `${mins}m` : "00m"}`;
    } catch {
      return "8h 00m";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Shift History
          </h1>
          <p className="text-md sm:text-md text-slate-500 font-medium mt-0.5">
            View and manage your scheduled and previous work sessions.
          </p>
        </div>
        <Button
          type="button"
          className="h-10 px-4 rounded-xl bg-[#3D5C57] hover:bg-[#2D4541] text-white font-bold text-md shadow-xs gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Calendar className="size-4" /> Download Report
        </Button>
      </div>

      {/* Shifts List */}
      <div className="grid gap-4">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <Card key={i} className="p-6 rounded-2xl border border-slate-200/80 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="size-12 rounded-2xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48 rounded-md" />
                    <Skeleton className="h-3 w-32 rounded-md" />
                  </div>
                </div>
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            </Card>
          ))
        ) : shifts && shifts.length > 0 ? (
          shifts.map((shift) => {
            const formattedDate = formatUkDate(new Date(shift.startTime), {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            });
            const timeRange = `${formatUkTime(shift.startTime)} - ${formatUkTime(shift.endTime)}`;
            const shiftTypeName = shift.type?.name || "Standard Shift";
            const duration = calculateDuration(shift.startTime, shift.endTime);

            return (
              <Card
                key={shift.id}
                onClick={() => setSelectedShift(shift)}
                className="p-5 sm:p-6 bg-white border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group gap-4"
              >
                <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                  <div className="size-12 bg-surface-primary-light rounded-2xl flex items-center justify-center text-icon-primary shrink-0 border border-emerald-100 shadow-2xs">
                    <Clock className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-md sm:text-base text-slate-900 group-hover:text-emerald-800 transition-colors truncate">
                        {formattedDate}
                      </h4>
                      <Badge variant="secondary" state="info" className="px-2.5 py-0.5 shadow-none">
                        {shift.status || "Published"}
                      </Badge>
                    </div>
                    <p className="text-md text-slate-500 font-medium mt-1 flex flex-wrap items-center gap-2">
                      <span>{shiftTypeName}</span>
                      <span>•</span>
                      <span>{timeRange}</span>
                      {shift.wing?.name && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-600">
                            <Building2 className="size-3 text-slate-400" />
                            {shift.wing.name}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] font-bold  text-slate-400 tracking-wider">
                      Total Time
                    </p>
                    <p className="font-bold text-md text-slate-900">{duration}</p>
                  </div>
                  <ArrowRight className="size-4 text-slate-400 group-hover:text-[#3D5C57] group-hover:translate-x-1 transition-all" />
                </div>
              </Card>
            );
          })
        ) : (
          <div className="p-12 text-center rounded-2xl bg-white border border-slate-200/80">
            <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mx-auto mb-3">
              <Clock className="size-6 text-[#3D5C57]" />
            </div>
            <h3 className="font-bold text-slate-800 text-md">No Shift Records</h3>
            <p className="text-md text-slate-500 mt-1">
              Your logged and assigned shifts will appear here.
            </p>
          </div>
        )}
      </div>

      <ShiftExecutionModal
        isOpen={Boolean(selectedShift)}
        onClose={() => setSelectedShift(null)}
        shift={selectedShift}
      />
    </div>
  );
}
