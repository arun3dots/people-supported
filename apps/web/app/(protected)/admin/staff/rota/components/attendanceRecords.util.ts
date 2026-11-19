import { format } from "date-fns";
import type { PropertyItem, SchemeItem } from "../../../../../../lib/types/facility";
import type { Shift } from "../../../../../../lib/types/shifts";
import type { StaffMember } from "../../../../../../lib/types/staff";
import type { AttendanceRecord } from "./AttendanceTable";
import {
  getCareBlockAppearance,
  getShiftDateStr,
  getShiftStaffIds,
  resolveStaffLocation,
} from "./rotaDataUtils";

export function buildAttendanceRecords(
  shifts: Shift[],
  staff: StaffMember[],
  schemes: SchemeItem[],
  properties: PropertyItem[],
  weekDays: Date[],
  dayFilter: string,
): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const weekDateStrings = new Set(weekDays.map((d) => format(d, "yyyy-MM-dd")));
  const targetShifts = shifts.filter((s) => {
    if (s.status === "Cancelled" || s.careType?.includes("Off")) return false;
    const dStr = getShiftDateStr(s);
    if (!dStr || !weekDateStrings.has(dStr)) return false;
    if (dayFilter !== "all" && dStr !== dayFilter) return false;
    return true;
  });

  const now = new Date();

  targetShifts.forEach((shift) => {
    const shiftDateStr = getShiftDateStr(shift);
    const dateLabel = shiftDateStr
      ? format(new Date(`${shiftDateStr}T00:00:00`), "dd MMM yyyy")
      : "-";
    const staffIds = getShiftStaffIds(shift);
    const appearance = getCareBlockAppearance(shift.careType, 0);
    const targetStaffList = staffIds
      .map((id) => staff.find((m) => m.id === id))
      .filter(Boolean) as StaffMember[];

    const shiftStart = shift.startTime ? new Date(shift.startTime) : null;
    const shiftEnd = shift.endTime ? new Date(shift.endTime) : null;

    targetStaffList.forEach((member) => {
      const loc = resolveStaffLocation(member, schemes, properties);
      const shiftLog = shift.staffLogs?.find((l) => l.userId === member.id);

      let clockInTime: string | null = null;
      let clockOutTime: string | null = null;
      let clockInLateMinutes: number | undefined = undefined;
      let hoursLogged: string | null = null;
      let status: AttendanceRecord["status"] = "Not started";

      if (member.isOnLeave) {
        status = "On leave";
      } else if (shiftLog) {
        const actualStart = shiftLog.actualStartTime
          ? new Date(shiftLog.actualStartTime)
          : null;
        const actualEnd = shiftLog.actualEndTime
          ? new Date(shiftLog.actualEndTime)
          : null;

        if (actualStart) {
          clockInTime = format(actualStart, "HH:mm");
          if (shiftStart) {
            const lateMins = Math.round(
              (actualStart.getTime() - shiftStart.getTime()) / 60_000,
            );
            if (lateMins > 5) {
              clockInLateMinutes = lateMins;
            }
          }
        }

        if (actualEnd) {
          clockOutTime = format(actualEnd, "HH:mm");
          if (actualStart) {
            const loggedHrs = Math.max(
              0,
              (actualEnd.getTime() - actualStart.getTime()) / 3_600_000,
            );
            hoursLogged = loggedHrs.toFixed(1);
          }
          if (
            shiftEnd &&
            (shiftEnd.getTime() - actualEnd.getTime()) / 60_000 > 5
          ) {
            status = "Left early";
          } else if (clockInLateMinutes && clockInLateMinutes > 5) {
            status = "Late";
          } else {
            status = "On time";
          }
        } else if (clockInTime) {
          status =
            clockInLateMinutes && clockInLateMinutes > 5
              ? "Late"
              : "On shift";
        }
      } else if (shiftStart && now > shiftStart) {
        status = "Absent";
      }

      if (!hoursLogged && shiftLog?.actualStartTime && shift.durationHours) {
        hoursLogged = `${shift.durationHours}`;
      }

      const dotClass = appearance.isSleepIn
        ? "bg-amber-500"
        : appearance.isNight
          ? "bg-rose-600"
          : appearance.shortLabel.includes("1:1")
            ? "bg-primary"
            : "bg-slate-700";

      records.push({
        id: `${shift.id}-${member.id}`,
        shiftId: shift.id,
        staffId: member.id,
        staffName: member.fullName,
        staffRole: member.role?.name || "Support Worker",
        staffPhone: member.phoneNumber || null,
        property: loc.propertyName || "Unassigned",
        dateLabel,
        shiftDateStr: shiftDateStr || undefined,
        scheduledTime: shift.shiftWindow || "08:00 - 16:00",
        careType: appearance.shortLabel || "Shared",
        careTypeColor: dotClass,
        clockInTime,
        clockInLateMinutes,
        clockInMethod: shiftLog ? "app" : undefined,
        clockOutTime,
        hoursLogged,
        status,
        notes: shift.notes || undefined,
      });
    });
  });

  return records;
}

