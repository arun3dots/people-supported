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
  DatePicker,
} from "@repo/ui/components/ui";
import type { PropertyItem, SchemeItem } from "../../../../../../lib/types/facility";
import type { Shift } from "../../../../../../lib/types/shifts";
import type { StaffMember } from "../../../../../../lib/types/staff";
import { AttendanceHeader } from "./AttendanceHeader";
import { AttendanceTable, type AttendanceRecord } from "./AttendanceTable";
import { AttendanceSidebar } from "./AttendanceSidebar";
import { AdjustAttendanceModal } from "./AdjustAttendanceModal";
import { buildAttendanceRecords } from "./attendanceRecords.util";
import { exportAttendanceTimesheetCsv } from "./attendanceExport.util";

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

  const initialRecords = useMemo(
    () => buildAttendanceRecords(shifts, staff, schemes, properties, weekDays, dayFilter),
    [shifts, staff, schemes, properties, weekDays, dayFilter],
  );

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
    exportAttendanceTimesheetCsv(filteredRecords, weekStart);
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
        <div className="lg:col-span-2 space-y-4 min-w-0">
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-2.5 justify-between">
            <div className="relative flex-1 min-w-[140px] [&_[data-slot=input-error]]:hidden">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none z-10" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff name or ID..."
                className="w-full h-10 pl-10 pr-4 bg-white border-slate-200/80 rounded-xl text-md text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-primary shadow-none"
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0 flex-nowrap overflow-x-auto no-scrollbar">
              <div className="w-[130px] shrink-0">
                <DatePicker
                  value={dayFilter !== "all" ? new Date(dayFilter) : undefined}
                  onChange={(d) => {
                    if (!d) {
                      setDayFilter("all");
                    } else {
                      const newStart = startOfWeek(d, { weekStartsOn: 1 });
                      setInternalWeekStart(newStart);
                      onSelectDate?.(d);
                      setDayFilter(format(d, "yyyy-MM-dd"));
                    }
                  }}
                  formatString="dd MMM yyyy"
                  placeholder="Select Date..."
                  className="w-full h-10"
                  triggerClassName="h-10 px-2.5 rounded-xl text-xs font-medium border-slate-200/80 bg-white shadow-none"
                />
              </div>

              <Select value={dayFilter} onValueChange={setDayFilter}>
                <SelectTrigger className="w-[110px] h-10 px-2.5 bg-white border-slate-200/80 rounded-xl text-xs font-medium shrink-0">
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
                <SelectTrigger className="w-[136px] h-10 px-2.5 bg-white border-slate-200/80 rounded-xl text-xs font-medium shrink-0">
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
                <SelectTrigger className="w-[122px] h-10 px-2.5 bg-white border-slate-200/80 rounded-xl text-xs font-medium shrink-0">
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
