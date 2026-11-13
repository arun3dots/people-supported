"use client";

import React from "react";
import {
  TableCell,
  TableFooter,
  TableRow,
  Text,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import type { Shift } from "../../../../../../lib/types/shifts";
import type { DayColumnInfo } from "./WeeklyRotaScheduleTable";
import { getShiftDateStr } from "./rotaDataUtils";
import { computeDailyCoverage } from "./rotaCoverageUtils";

interface WeeklyRotaDailyCoverageFooterProps {
  days: DayColumnInfo[];
  shifts: Shift[];
}

export function WeeklyRotaDailyCoverageFooter({
  days,
  shifts,
}: WeeklyRotaDailyCoverageFooterProps): React.JSX.Element {
  return (
    <TableFooter className="bg-slate-50/90 text-slate-900 border-t-2 border-slate-200">
      <TableRow className="hover:bg-transparent">
        <TableCell className="py-3 px-3.5 align-middle">
          <Text size="sm" weight="semibold" className="text-slate-900 leading-tight">
            Daily Coverage
          </Text>
          <Text size="xs" variant="muted" className="mt-0.5">
            Target vs. deployed carers
          </Text>
        </TableCell>
        {days.map((d) => {
          const dayShifts = shifts.filter((s) => getShiftDateStr(s) === d.dateStr);
          const cov = computeDailyCoverage(dayShifts);

          return (
            <TableCell key={`coverage-${d.key}`} className="py-2.5 px-2 text-center align-middle">
              <div className="flex flex-col items-center justify-center gap-0.5">
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border shadow-2xs",
                    cov.status === "optimal" && "bg-emerald-50 text-emerald-800 border-emerald-200/90",
                    cov.status === "warning" && "bg-amber-50 text-amber-800 border-amber-200/90",
                    cov.status === "gap" && "bg-rose-50 text-rose-700 border-rose-200/90",
                  )}
                >
                  {cov.status === "optimal" && "✓ "}
                  {cov.status === "warning" && "⚠️ "}
                  {cov.status === "gap" && "⛔ "}
                  {cov.statusLabel}
                </span>

                {cov.activeStaffCount > 0 ? (
                  <>
                    <span className="text-xs font-semibold text-slate-800 mt-0.5">
                      {cov.totalPlannedHours}h total
                    </span>
                    <span className="text-xs text-slate-500">
                      {cov.activeStaffCount} {cov.activeStaffCount === 1 ? "carer" : "carers"}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-medium text-rose-600 mt-0.5">
                      0.0h deployed
                    </span>
                    <span className="text-xs text-slate-400">
                      Unstaffed
                    </span>
                  </>
                )}
              </div>
            </TableCell>
          );
        })}
      </TableRow>
    </TableFooter>
  );
}
