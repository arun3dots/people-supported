"use client";

import React, { useMemo, useState } from "react";
import { addDays, addWeeks, format, startOfWeek, subWeeks } from "date-fns";
import { Search } from "lucide-react";
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui";
import type { PropertyItem, SchemeItem } from "../../../../../../lib/types/facility";
import type { Shift } from "../../../../../../lib/types/shifts";
import type { StaffMember } from "../../../../../../lib/types/staff";
import { AttendanceHeader } from "./AttendanceHeader";
import { AttendanceTable, type AttendanceRecord } from "./AttendanceTable";
import { AttendanceSidebar } from "./AttendanceSidebar";
import { AdjustAttendanceModal } from "./AdjustAttendanceModal";
import {
  getCareBlockAppearance,
  getShiftDateStr,
  getShiftStaffIds,
  resolveStaffLocation,
} from "./rotaDataUtils";

interface AttendanceViewProps {
  shifts: Shift[];
  staff: StaffMember[];
  schemes: SchemeItem[];
  properties: PropertyItem[];
  currentWeekStart?: Date;
  onPreviousWeek?: () => void;
  onNextWeek?: () => void;
  onCurrentWeek?: () => void;
  onSelectDate?: (date: Date) => void;
  onExport?: () => void;
}

export function AttendanceView({
  shifts,
  staff,
  schemes,
  properties,
  currentWeekStart: controlledWeekStart,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
  onSelectDate,
  onExport,
}: AttendanceViewProps): React.JSX.Element {
  const [internalWeekStart, setInternalWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const weekStart = controlledWeekStart ?? internalWeekStart;

  const handlePreviousWeek = () => {
    setDayFilter("all");
    if (onPreviousWeek) onPreviousWeek();
    else setInternalWeekStart((prev) => subWeeks(prev, 1));
  };
  const handleNextWeek = () => {
    setDayFilter("all");
    if (onNextWeek) onNextWeek();
    else setInternalWeekStart((prev) => addWeeks(prev, 1));
  };
  const handleCurrentWeek = () => {
    setDayFilter("all");
    if (onCurrentWeek) onCurrentWeek();
    else setInternalWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };
  const handleSelectDate = (d: Date) => {
    setDayFilter("all");
    if (onSelectDate) onSelectDate(d);
    else setInternalWeekStart(startOfWeek(d, { weekStartsOn: 1 }));
  };

  const [dayFilter, setDayFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [adjustingRecord, setAdjustingRecord] = useState<AttendanceRecord | null>(null);
  const [localOverrides, setLocalOverrides] = useState<Record<string, Partial<AttendanceRecord>>>({});

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const initialRecords = useMemo(() => {
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
          property: loc.propertyName || "Unassigned",
          dateLabel,
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
  }, [shifts, staff, schemes, properties, weekDays, dayFilter]);

  const records = useMemo(() => {
    return initialRecords.map((r) => {
      const override = localOverrides[r.id];
      return override ? { ...r, ...override } : r;
    });
  }, [initialRecords, localOverrides]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (propertyFilter !== "all" && r.property !== propertyFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          r.staffName.toLowerCase().includes(q) ||
          r.staffRole.toLowerCase().includes(q) ||
          r.property.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [records, propertyFilter, statusFilter, search]);

  const totalScheduled = records.length;
  const clockedInCount = records.filter(
    (r) => r.status === "On time" || r.status === "Late" || r.status === "On shift",
  ).length;
  const lateCount = records.filter((r) => r.status === "Late").length;
  const absentCount = records.filter((r) => r.status === "Absent").length;
  const punctuality =
    clockedInCount > 0 ? Math.round(((clockedInCount - lateCount) / clockedInCount) * 100) : 100;

  const totalHoursLogged = records
    .reduce((acc, r) => acc + (Number.parseFloat(r.hoursLogged || "0") || 0), 0)
    .toFixed(1);

  const handleExportTimesheet = () => {
    if (onExport) {
      onExport();
      return;
    }
    const escapeCsv = (val: string | number | null | undefined): string => {
      const str = String(val ?? "");
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const headers = [
      "Date",
      "Staff Member",
      "Role",
      "Property",
      "Care Type",
      "Scheduled",
      "Clock In",
      "Clock Out",
      "Hours Logged",
      "Status",
    ];
    const csvRows = [
      headers.join(","),
      ...filteredRecords.map((r) =>
        [
          r.dateLabel,
          r.staffName,
          r.staffRole,
          r.property,
          r.careType,
          r.scheduledTime,
          r.clockInTime || "",
          r.clockOutTime || "",
          r.hoursLogged ? `${r.hoursLogged}h` : "",
          r.status,
        ]
          .map(escapeCsv)
          .join(","),
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-timesheet-${format(weekStart, "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12 font-sans animate-in fade-in duration-300">
      <AttendanceHeader
        currentWeekStart={weekStart}
        onPreviousWeek={handlePreviousWeek}
        onNextWeek={handleNextWeek}
        onCurrentWeek={handleCurrentWeek}
        onSelectDate={handleSelectDate}
        isSingleDayFiltered={dayFilter !== "all"}
        onExport={handleExportTimesheet}
        totalScheduled={totalScheduled}
        clockedInCount={clockedInCount}
        lateCount={lateCount}
        absentCount={absentCount}
        punctuality={punctuality}
        totalHoursLogged={totalHoursLogged}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 justify-between">
            <div className="relative flex-1 min-w-48 [&_[data-slot=input-error]]:hidden">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none z-10" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff name or ID..."
                className="w-full h-10 pl-10 pr-4 bg-white border-slate-200/80 rounded-xl text-md text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-primary shadow-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Select value={dayFilter} onValueChange={setDayFilter}>
                <SelectTrigger className="w-36 h-10 bg-white rounded-xl text-sm font-medium">
                  <SelectValue placeholder="All Days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Week</SelectItem>
                  {weekDays.map((d) => {
                    const value = format(d, "yyyy-MM-dd");
                    return (
                      <SelectItem key={value} value={value}>
                        {format(d, "EEE dd MMM")}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                <SelectTrigger className="w-40 h-10 bg-white rounded-xl text-sm font-medium">
                  <SelectValue placeholder="All Properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-10 bg-white rounded-xl text-sm font-medium">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="On time">On time</SelectItem>
                  <SelectItem value="Late">Late</SelectItem>
                  <SelectItem value="On shift">On shift</SelectItem>
                  <SelectItem value="Absent">Absent</SelectItem>
                  <SelectItem value="Left early">Left early</SelectItem>
                  <SelectItem value="Not started">Not started</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <AttendanceTable
            records={filteredRecords}
            onAdjustRecord={(record) => setAdjustingRecord(record)}
          />
        </div>

        <div className="lg:col-span-1">
          <AttendanceSidebar
            records={records}
            shifts={shifts}
            weekStart={weekStart}
            onRecordReason={(record) => setAdjustingRecord(record)}
          />
        </div>
      </div>

      <AdjustAttendanceModal
        open={Boolean(adjustingRecord)}
        onOpenChange={(open) => !open && setAdjustingRecord(null)}
        record={adjustingRecord}
        onSave={(id, updates) => {
          setLocalOverrides((prev) => ({
            ...prev,
            [id]: { ...(prev[id] || {}), ...updates },
          }));
        }}
      />
    </div>
  );
}
