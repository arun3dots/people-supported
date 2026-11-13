"use client";

import React, { useState, useMemo, useEffect } from "react";
import { format, startOfWeek, addDays, subWeeks, addWeeks } from "date-fns";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Spinner, Text } from "@repo/ui/components/ui";
import { useToast } from "@repo/ui/hooks";
import {
  useGetShiftsQuery,
  useUpdateShiftMutation,
  useCreateShiftMutation,
  useGetStaffAllocationQuery,
} from "../../../../../../lib/queries/shifts";
import { useGetStaffQuery } from "../../../../../../lib/queries/staff";
import {
  useGetSchemesQuery,
  useGetPropertiesQuery,
} from "../../../../../../lib/queries/facility";
import { useGetResidentsQuery } from "../../../../../../lib/queries/residents";
import { useExportShiftsReportMutation } from "../../../../../../lib/queries/reports";
import type { Shift } from "../../../../../../lib/types/shifts";
import type { StaffMember } from "../../../../../../lib/types/staff";
import {
  SupportHoursRotaHeader,
  type RotaHeaderMetrics,
} from "./SupportHoursRotaHeader";
import {
  RotaUnifiedFilterBar,
  type RotaFilterState,
} from "./RotaUnifiedFilterBar";
import {
  WeeklyRotaScheduleTable,
  type DayColumnInfo,
} from "./WeeklyRotaScheduleTable";
import { RotaSummaryWidgets } from "./RotaSummaryWidgets";
import { RotaModalsContainer } from "./RotaModalsContainer";
import type { ShiftBlockFormData } from "./ModifyShiftBlockModal";
import { HoursSummaryView } from "./HoursSummaryView";
import { StaffAllocationView } from "./StaffAllocationView";
import { AttendanceView } from "./AttendanceView";
import { executeSaveShiftBlock } from "./useShiftSaveHandler";
import {
  computeRotaMetrics,
  getShiftDateStr,
  resolveStaffLocation,
} from "./rotaDataUtils";

const INITIAL_FILTERS: RotaFilterState = {
  schemeId: "all",
  propertyId: "all",
  dayOfWeek: "all",
  staffId: "all",
  careType: "All Care Types",
};

export function RotaContainer(): React.JSX.Element {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tabParam = searchParams?.get("tab");

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [activeView, setActiveView] = useState<
    "rota" | "hours" | "allocation" | "attendance"
  >("rota");

  const [filters, setFilters] = useState<RotaFilterState>(INITIAL_FILTERS);

  useEffect(() => {
    if (tabParam === "hours") setActiveView("hours");
    else if (tabParam === "allocation") setActiveView("allocation");
    else if (tabParam === "attendance") setActiveView("attendance");
    else setActiveView("rota");
  }, [tabParam]);

  const handleViewChange = (
    nextView: "rota" | "hours" | "allocation" | "attendance",
  ): void => {
    setActiveView(nextView);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (nextView === "rota") params.delete("tab");
    else params.set("tab", nextView);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const [detailsShift, setDetailsShift] = useState<Shift | null>(null);
  const [detailsContext, setDetailsContext] = useState<{ staffName: string; staffRole?: string; dayLabel: string }>({ staffName: "", dayLabel: "" });
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [slotToAdd, setSlotToAdd] = useState<{ staff?: StaffMember; day?: DayColumnInfo } | null>(null);
  const [reassignStaff, setReassignStaff] = useState<StaffMember | null>(null);
  const [lockedWeeks, setLockedWeeks] = useState<Record<string, boolean>>({});
  const weekKey = format(currentWeekStart, "yyyy-MM-dd");
  const isRotaLocked = Boolean(lockedWeeks[weekKey]);

  const { data: shiftsData, isLoading: isShiftsLoading } = useGetShiftsQuery();
  const { data: staffData, isLoading: isStaffLoading } = useGetStaffQuery();
  const { data: schemes = [] } = useGetSchemesQuery();
  const { data: properties = [] } = useGetPropertiesQuery();
  const { data: residentsData } = useGetResidentsQuery();
  const { data: allocationData } = useGetStaffAllocationQuery(
    {
      from: format(currentWeekStart, "yyyy-MM-dd"),
      to: format(addDays(currentWeekStart, 6), "yyyy-MM-dd"),
      wingId: filters.propertyId !== "all" ? filters.propertyId : undefined,
    },
    { enabled: activeView === "allocation" },
  );

  const updateShiftMutation = useUpdateShiftMutation();
  const createShiftMutation = useCreateShiftMutation();
  const exportShiftsMutation = useExportShiftsReportMutation();

  const handleExportRotaCsv = async () => {
    try {
      const res = await exportShiftsMutation.mutateAsync();
      toast({
        title: "Rota Report Exported",
        description: `${res?.rowCount ?? 0} shifts exported to CSV.`,
      });
    } catch {
      toast({
        title: "Export Failed",
        description: "Failed to export staff rota report.",
        variant: "destructive",
      });
    }
  };

  const shifts: Shift[] = useMemo(() => (Array.isArray(shiftsData) ? shiftsData : []), [shiftsData]);
  const staffList: StaffMember[] = useMemo(() => (Array.isArray(staffData) ? staffData : []), [staffData]);
  const residents = useMemo(
    () =>
      Array.isArray(residentsData)
        ? residentsData.filter((r) => r.status === "Active")
        : [],
    [residentsData],
  );

  const days: DayColumnInfo[] = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const dayDate = addDays(currentWeekStart, i);
      return {
        key: `day-${i}`,
        dayName: format(dayDate, "EEE"),
        dayNumber: format(dayDate, "dd MMM"),
        dateStr: format(dayDate, "yyyy-MM-dd"),
      };
    });
  }, [currentWeekStart]);

  const weekShifts = useMemo(() => {
    const weekDateStrings = new Set(days.map((d) => d.dateStr));
    return shifts.filter((s) => {
      const dStr = getShiftDateStr(s);
      return dStr ? weekDateStrings.has(dStr) : false;
    });
  }, [shifts, days]);

  const metrics: RotaHeaderMetrics = useMemo(
    () => computeRotaMetrics(schemes, residents, weekShifts),
    [schemes, residents, weekShifts],
  );

  // Filter shifts based on active care type and day of week
  const filteredShifts = useMemo(() => {
    return weekShifts.filter((s) => {
      if (filters.careType !== "All Care Types" && s.careType !== filters.careType) {
        return false;
      }
      if (filters.dayOfWeek !== "all") {
        const dStr = getShiftDateStr(s);
        const matchDay = days.find((d) => d.dateStr === dStr);
        if (matchDay) {
          const fullDayName = format(new Date(matchDay.dateStr), "EEEE");
          if (fullDayName !== filters.dayOfWeek) return false;
        }
      }
      return true;
    });
  }, [weekShifts, filters.careType, filters.dayOfWeek, days]);

  // Filter staff based on scheme, property, and staff filters
  const filteredStaffList = useMemo(() => {
    return staffList.filter((m) => {
      const loc = resolveStaffLocation(m, schemes, properties);
      if (filters.schemeId !== "all" && loc.schemeId !== filters.schemeId) return false;
      if (filters.propertyId !== "all" && loc.propertyId !== filters.propertyId) return false;
      if (filters.staffId !== "all" && m.id !== filters.staffId) return false;
      return true;
    });
  }, [staffList, schemes, properties, filters.schemeId, filters.propertyId, filters.staffId]);

  const draftShifts = useMemo(
    () => weekShifts.filter((s) => s.status === "Draft" || !s.status),
    [weekShifts],
  );

  const handlePublishRota = async () => {
    if (isRotaLocked) {
      toast({ title: "Rota is locked", description: "Unlock the rota before publishing changes.", variant: "destructive" });
      return;
    }
    if (draftShifts.length === 0) return;
    try {
      await Promise.all(
        draftShifts.map((s) => updateShiftMutation.mutateAsync({ id: s.id, status: "Published" })),
      );
      toast({ title: "Rota published successfully", description: `${draftShifts.length} shift(s) published.` });
    } catch {
      toast({ title: "Publication failed", description: "Could not publish shifts. Check for conflicts.", variant: "destructive" });
    }
  };

  const handleSaveShiftBlock = async (formData: ShiftBlockFormData) => {
    await executeSaveShiftBlock({ formData, editingShift, slotToAdd, createShiftMutation, updateShiftMutation });
    setEditingShift(null);
    setSlotToAdd(null);
  };

  const handleExportCsv = () => {
    const headers = ["Date", "Staff", "Care Type", "Window", "Hours", "Status"];
    const rows = weekShifts.map((s) => {
      const staffNames = staffList
        .filter((m) => s.userIds?.includes(m.id) || s.assignments?.some((a) => a.userId === m.id))
        .map((m) => m.fullName)
        .join("; ");
      const dateStr = getShiftDateStr(s);
      const escape = (v: string | number | null | undefined) =>
        `"${String(v ?? "").replace(/"/g, '""')}"`;
      return [
        escape(dateStr),
        escape(staffNames || "Unassigned"),
        escape(s.careType || "Shared Care"),
        escape(s.shiftWindow || ""),
        escape(s.durationHours ?? ""),
        escape(s.status || "Draft"),
      ].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rota-${format(currentWeekStart, "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isShiftsLoading || isStaffLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center font-sans">
        <Spinner />
        <Text size="md" weight="medium" variant="subdued" className="mt-3">
          Loading Support Hours &amp; Rota&hellip;
        </Text>
      </div>
    );
  }

  // When tab=attendance is active, render Attendance View (Image 5)
  if (activeView === "attendance") {
    return (
      <AttendanceView
        shifts={shifts}
        staff={staffList}
        schemes={schemes}
        properties={properties}
        currentWeekStart={currentWeekStart}
        onPreviousWeek={() => setCurrentWeekStart((prev) => subWeeks(prev, 1))}
        onNextWeek={() => setCurrentWeekStart((prev) => addWeeks(prev, 1))}
        onCurrentWeek={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
        onSelectDate={(d) => setCurrentWeekStart(startOfWeek(d, { weekStartsOn: 1 }))}
      />
    );
  }

  const selectedMonth = format(currentWeekStart, "MMMM yyyy");
  const selectedWeek = `${format(currentWeekStart, "dd MMM")} - ${format(addDays(currentWeekStart, 6), "dd MMM yyyy")}`;

  return (
    <div className="space-y-6 pb-12 font-sans animate-in fade-in duration-300">
      <SupportHoursRotaHeader
        metrics={metrics}
        activeView={activeView}
        selectedMonth={selectedMonth}
        selectedWeek={selectedWeek}
        draftShiftCount={draftShifts.length}
        onPublishRota={handlePublishRota}
        isPublishing={updateShiftMutation.isPending}
        onCreateShift={() => {
          if (isRotaLocked) {
            toast({ title: "Rota is locked", description: "Unlock the rota to add or edit shifts.", variant: "destructive" });
            return;
          }
          setEditingShift(null);
          setSlotToAdd({});
        }}
        onExport={handleExportRotaCsv}
      />

      <RotaUnifiedFilterBar
        activeView={activeView}
        onViewChange={handleViewChange}
        filters={filters}
        onFilterChange={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
        onResetFilters={() => setFilters(INITIAL_FILTERS)}
        schemes={schemes}
        properties={properties}
        staff={staffList}
        weekNavigation={{
          currentDate: currentWeekStart,
          onPreviousWeek: () => setCurrentWeekStart((prev) => subWeeks(prev, 1)),
          onNextWeek: () => setCurrentWeekStart((prev) => addWeeks(prev, 1)),
          onCurrentWeek: () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 })),
          onSelectDate: (d) => setCurrentWeekStart(startOfWeek(d, { weekStartsOn: 1 })),
        }}
      />

      {activeView === "rota" && (
        <>
          <WeeklyRotaScheduleTable
            days={days}
            staffList={filteredStaffList}
            shifts={filteredShifts}
            schemes={schemes}
            properties={properties}
            activeCareTypeFilter={filters.careType}
            isLocked={isRotaLocked}
            currentDate={currentWeekStart}
            onPreviousWeek={() => setCurrentWeekStart((prev) => subWeeks(prev, 1))}
            onNextWeek={() => setCurrentWeekStart((prev) => addWeeks(prev, 1))}
            onCurrentWeek={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            onSelectDate={(d) => setCurrentWeekStart(startOfWeek(d, { weekStartsOn: 1 }))}
            onSelectShift={(shift, staffName, dayLabel) => {
              const matchedStaff = staffList.find((m) => m.fullName === staffName);
              setDetailsShift(shift);
              setDetailsContext({
                staffName,
                staffRole: matchedStaff?.role?.name,
                dayLabel,
              });
            }}
            onAddShiftBlock={(staff, day) => {
              setEditingShift(null);
              setSlotToAdd({ staff, day });
            }}
            onReassignStaff={(staff) => {
            if (isRotaLocked) {
              toast({
                title: "Rota is locked",
                description: "Unlock the rota to assign shifts.",
                variant: "destructive",
              });
              return;
            }
            const todayDateStr = format(new Date(), "yyyy-MM-dd");
            const targetDay = days.find((d) => d.dateStr === todayDateStr) || days[0];
            handleViewChange("rota");
            if (targetDay) setSlotToAdd({ staff, day: targetDay });
          }}
          />

          <RotaSummaryWidgets
            shifts={weekShifts}
            staffList={staffList}
            isLocked={isRotaLocked}
            onLockToggle={(nextLocked) => {
              setLockedWeeks((prev) => ({ ...prev, [weekKey]: nextLocked }));
              toast({
                title: nextLocked ? "Rota locked" : "Rota unlocked",
                description: nextLocked
                  ? "Editing is disabled for this week until unlocked."
                  : "You can now add and edit shifts for this week.",
              });
            }}
            onViewHours={() => handleViewChange("hours")}
            onViewAllocation={() => handleViewChange("allocation")}
            onExportPdf={() => typeof window !== "undefined" && window.print()}
            onExportExcel={handleExportRotaCsv}
            onViewAudit={() => router.push("/admin/audit-log")}
          />
        </>
      )}

      {activeView === "hours" && (
        <HoursSummaryView
          shifts={weekShifts}
          schemes={schemes}
          properties={properties}
          staff={staffList}
          residents={residents}
          days={days}
          activeCareType={filters.careType}
          schemeFilter={filters.schemeId}
          propertyFilter={filters.propertyId}
          staffFilter={filters.staffId}
        />
      )}

      {activeView === "allocation" && (
        <StaffAllocationView
          schemes={schemes}
          properties={properties}
          staff={staffList}
          shifts={weekShifts}
          allocationData={allocationData}
          activeCareType={filters.careType}
          schemeFilter={filters.schemeId}
          propertyFilter={filters.propertyId}
          staffFilter={filters.staffId}
          onReassignStaff={(staff) => {
            if (isRotaLocked) {
              toast({
                title: "Rota is locked",
                description: "Unlock the rota to assign shifts.",
                variant: "destructive",
              });
              return;
            }
            const todayDateStr = format(new Date(), "yyyy-MM-dd");
            const targetDay = days.find((d) => d.dateStr === todayDateStr) || days[0];
            handleViewChange("rota");
            if (targetDay) setSlotToAdd({ staff, day: targetDay });
          }}
        />
      )}

      <RotaModalsContainer
        detailsShift={detailsShift}
        onCloseDetails={() => setDetailsShift(null)}
        detailsContext={detailsContext}
        onEditFromDetails={(shift) => {
          setDetailsShift(null);
          setEditingShift(shift);
        }}
        onAddAnotherShift={(shift) => {
          const staff =
            staffList.find((m) => m.fullName === detailsContext.staffName) ??
            staffList.find(
              (m) =>
                shift.userIds?.includes(m.id) ||
                shift.assignments?.some((a) => a.userId === m.id),
            );
          const dateStr = getShiftDateStr(shift);
          const day = days.find((d) => d.dateStr === dateStr);
          setDetailsShift(null);
          setEditingShift(null);
          if (staff && day) setSlotToAdd({ staff, day });
        }}
        editingShift={editingShift}
        slotToAdd={slotToAdd}
        onCloseModify={() => {
          setEditingShift(null);
          setSlotToAdd(null);
        }}
        onSaveShiftBlock={handleSaveShiftBlock}
        isSavingShift={createShiftMutation.isPending || updateShiftMutation.isPending}
        reassignStaff={reassignStaff}
        onCloseReassign={() => setReassignStaff(null)}
        staffList={staffList}
        residents={residents}
        schemes={schemes}
        properties={properties}
        isLocked={isRotaLocked}
      />
    </div>
  );
}
