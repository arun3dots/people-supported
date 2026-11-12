"use client";

import React, { useMemo, useState } from "react";
import { format } from "date-fns";
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
  onExport?: () => void;
}

export function AttendanceView({
  shifts,
  staff,
  schemes,
  properties,
  onExport,
}: AttendanceViewProps): React.JSX.Element {
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() =>
    format(new Date(), "yyyy-MM-dd"),
  );
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [adjustingRecord, setAdjustingRecord] = useState<AttendanceRecord | null>(null);
  const [localOverrides, setLocalOverrides] = useState<Record<string, Partial<AttendanceRecord>>>({});

  const initialRecords = useMemo(() => {
    const records: AttendanceRecord[] = [];
    const dayShifts = shifts.filter((s) => getShiftDateStr(s) === selectedDateStr);

    dayShifts.forEach((shift) => {
      const staffIds = getShiftStaffIds(shift);
      const appearance = getCareBlockAppearance(shift.careType, 0);
      const targetStaffList =
        staffIds.length > 0
          ? (staffIds.map((id) => staff.find((m) => m.id === id)).filter(Boolean) as StaffMember[])
          : staff.slice(0, 1);

      targetStaffList.forEach((member) => {
        const loc = resolveStaffLocation(member, schemes, properties);
        const shiftLog = shift.staffLogs?.find((l) => l.userId === member.id);

        let clockInTime: string | null = null;
        let clockOutTime: string | null = null;
        let clockInLateMinutes: number | undefined = undefined;
        let hoursLogged: string | null = null;
        let status: AttendanceRecord["status"] = "Not started";

        if (shiftLog) {
          if (shiftLog.actualStartTime) {
            clockInTime = format(new Date(shiftLog.actualStartTime), "HH:mm");
          }
          if (shiftLog.actualEndTime) {
            clockOutTime = format(new Date(shiftLog.actualEndTime), "HH:mm");
            status = "On time";
          } else if (clockInTime) {
            status = "On shift";
          }
        } else {
          const startHours = shift.shiftWindow?.split("-")[0]?.trim();
          if (startHours) {
            clockInTime = startHours;
            status = "On time";
          }
        }

        if (shift.durationHours && shift.durationHours > 0) {
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
          property: loc.propertyName || "Oak House",
          scheduledTime: shift.shiftWindow || "08:00 - 16:00",
          careType: appearance.shortLabel || "Shared",
          careTypeColor: dotClass,
          clockInTime,
          clockInLateMinutes,
          clockInMethod: "app",
          clockOutTime,
          hoursLogged,
          status,
          notes: shift.notes || undefined,
        });
      });
    });

    return records;
  }, [shifts, staff, schemes, properties, selectedDateStr]);

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

  return (
    <div className="space-y-6 pb-12 font-sans animate-in fade-in duration-300">
      <AttendanceHeader
        selectedDateStr={selectedDateStr}
        onDateChange={setSelectedDateStr}
        onExport={onExport}
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

            <div className="flex items-center gap-2 shrink-0">
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
