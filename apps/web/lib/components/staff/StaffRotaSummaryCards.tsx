"use client";

import React from "react";
import { format } from "date-fns";
import { Button } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import { ShiftRequest } from "../../types/shifts";

interface StaffRotaSummaryCardsProps {
  weeklyHours: number;
  shiftCount: number;
  twoWeekHours: number;
  contractedHours?: number | null;
  clockInDisplay: string;
  shiftRequests: ShiftRequest[];
  onRequestLeave: () => void;
}

export function StaffRotaSummaryCards({
  weeklyHours,
  shiftCount,
  twoWeekHours,
  contractedHours,
  clockInDisplay,
  shiftRequests,
  onRequestLeave,
}: StaffRotaSummaryCardsProps) {
  const isWorkingTimeCompliant = weeklyHours <= 48;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Hours Summary Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-2sm">
        <h3 className="text-base font-bold text-slate-900 mb-4">Hours</h3>
        <div className="space-y-3 text-md">
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-0.5">
            <span className="text-slate-500 font-normal sm:w-44 shrink-0">
              Scheduled this week
            </span>
            <span className="text-slate-800 font-medium">
              {`${weeklyHours.toFixed(1)} h (${shiftCount} shift${shiftCount === 1 ? "" : "s"
                })`}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-0.5">
            <span className="text-slate-500 font-normal sm:w-44 shrink-0">
              Two-week cycle
            </span>
            <span className="text-slate-800 font-medium">
              {contractedHours != null
                ? `${twoWeekHours.toFixed(1)} h vs ${contractedHours.toFixed(
                  1
                )} h contracted`
                : `${twoWeekHours.toFixed(1)} h`}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-0.5">
            <span className="text-slate-500 font-normal sm:w-44 shrink-0">
              Clock-in today
            </span>
            <span className="text-slate-800 font-medium">
              {clockInDisplay}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-0.5">
            <span className="text-slate-500 font-normal sm:w-44 shrink-0">
              Working time
            </span>
            <span className="text-slate-800 font-medium">
              {isWorkingTimeCompliant
                ? "Within 48 h average · rest periods compliant"
                : "Exceeds 48 h weekly average"}
            </span>
          </div>
        </div>
      </div>

      {/* My Requests Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-2sm flex flex-col justify-between min-h-[170px]">
        <div>
          <h3 className="text-base font-bold text-slate-900 mb-3">
            My requests
          </h3>

          {shiftRequests.length > 0 ? (
            <div className="space-y-2 mb-4">
              {shiftRequests.slice(0, 3).map((req: ShiftRequest) => {
                const reqStart = new Date(req.startTime);
                const formattedDate = !isNaN(reqStart.getTime())
                  ? format(reqStart, "d MMM")
                  : "Scheduled";

                return (
                  <div
                    key={req.id}
                    className="flex items-center justify-between text-md py-1 border-b border-slate-100 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">
                        {req.type === "Leave"
                          ? "Annual Leave"
                          : req.type === "Change"
                            ? "Shift Swap"
                            : "Shift Cover"}
                      </span>
                      <span className="text-slate-400 text-md">
                        ({formattedDate})
                      </span>
                    </div>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-md font-semibold",
                        req.status === "Approved"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : req.status === "Rejected"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                      )}
                    >
                      {req.status}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-md text-slate-500 mb-4">
              No swap or leave requests.
            </p>
          )}
        </div>

        <div className="pt-2">
          <Button
            variant="outline"
            onClick={onRequestLeave}
            className="rounded-lg border-slate-300 text-slate-700 text-md font-medium hover:bg-slate-50 transition-colors shadow-2sm py-1.5 px-3 h-auto"
          >
            Submit Request
          </Button>
        </div>
      </div>
    </div>
  );
}
