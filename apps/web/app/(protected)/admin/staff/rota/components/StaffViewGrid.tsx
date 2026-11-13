"use client";

import React from "react";
import { format, addDays, startOfWeek } from "date-fns";
import { StaffMember } from "../../../../../../lib/types/staff";
import { Shift, ShiftAssignment } from "../../../../../../lib/types/shifts";
import {
  formatUkTime,
  getUkDateString,
  getLocalCalendarDateString,
} from "../../../../../../lib/utils/uk-date-time";

interface StaffViewGridProps {
  currentDate: Date;
  staffList?: StaffMember[];
  shifts?: Shift[];
  onAddShift: (date?: Date, staffId?: string) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ShiftBadge({ shift }: { shift?: Shift }) {
  if (!shift) {
    return (
      <div className="py-2 px-3 rounded-xl bg-slate-50 text-slate-300 text-md font-semibold text-center">
        -
      </div>
    );
  }

  const start = new Date(shift.startTime);
  const end = new Date(shift.endTime);
  const startH = Number(formatUkTime(start).slice(0, 2));

  let colorClass = "bg-primary/10 border border-primary/20 text-primary";
  let subColor = "text-primary";
  let label = shift.type?.name ?? "Shift";

  if (startH >= 15 && startH < 21) {
    colorClass = "bg-amber-50 border border-amber-200 text-amber-900";
    subColor = "text-amber-700";
  } else if (startH >= 21 || startH < 6) {
    colorClass = "bg-blue-50 border border-blue-200 text-blue-900";
    subColor = "text-blue-700";
  }

  return (
    <div className={`py-2 px-3 rounded-xl ${colorClass} text-md font-semibold text-center shadow-2xs`}>
      <div className="font-bold">{label}</div>
      <div className={`text-md ${subColor} mt-0.5`}>
        {formatUkTime(start)} - {formatUkTime(end)}
      </div>
    </div>
  );
}

export function StaffViewGrid({ currentDate, staffList = [], shifts = [], onAddShift }: StaffViewGridProps) {
  const startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  const getShiftForStaffOnDay = (staffId: string, day: Date): Shift | undefined => {
    return shifts.find((s) => {
      return (
        getUkDateString(s.startTime) === getLocalCalendarDateString(day) &&
        (s.assignments as ShiftAssignment[] | undefined)?.some((a) => a.user?.id === staffId)
      );
    });
  };

  if (staffList.length === 0) {
    return (
      <div className="bg-surface-card-grey border-none rounded-2xl p-6 shadow-none flex items-center justify-center h-48 text-slate-400 text-md font-medium font-sans">
        No staff members found.
      </div>
    );
  }

  return (
    <div className="bg-surface-card-grey border-none rounded-2xl p-5 lg:p-6 shadow-none overflow-x-auto font-sans">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full border-collapse min-w-[1000px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="py-3.5 px-4 text-left text-md font-bold text-slate-900 w-56">Staff Member</th>
              {days.map((day, idx) => (
                <th key={idx} className="py-3.5 px-3 text-center">
                  <div className="text-md font-semibold text-slate-500  tracking-wider">
                    {format(day, "EEEE")}
                  </div>
                  <div className="text-md font-bold text-slate-900 mt-0.5">{format(day, "d MMM")}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staffList.map((staff) => (
              <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3.5 px-4 align-middle">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full overflow-hidden bg-primary/10 text-primary border border-primary/20 shrink-0 flex items-center justify-center font-bold text-md">
                      {staff.avatarUrl ? (

                        <img src={staff.avatarUrl} alt={staff.fullName} className="object-cover size-full" />
                      ) : (
                        getInitials(staff.fullName)
                      )}
                    </div>
                    <div>
                      <div className="text-md font-bold text-slate-900">{staff.fullName}</div>
                      <div className="text-md text-slate-500">{staff.role?.name}</div>
                    </div>
                  </div>
                </td>

                {days.map((day, dayIdx) => {
                  const shift = getShiftForStaffOnDay(staff.id, day);
                  return (
                    <td
                      key={dayIdx}
                      onClick={() => onAddShift(day, staff.id)}
                      className="py-3 px-2 text-center align-middle cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <ShiftBadge shift={shift} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
