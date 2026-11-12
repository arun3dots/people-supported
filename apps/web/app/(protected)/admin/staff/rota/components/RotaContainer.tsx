"use client";

import React, { useState, useMemo, useEffect } from "react";
import { format, startOfWeek, addDays } from "date-fns";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Spinner, Text } from "@repo/ui/components/ui";
import {
  useGetShiftsQuery,
  useUpdateShiftMutation,
  useCreateShiftMutation,
} from "../../../../../../lib/queries/shifts";
import { useGetStaffQuery } from "../../../../../../lib/queries/staff";
import {
  useGetSchemesQuery,
  useGetPropertiesQuery,
} from "../../../../../../lib/queries/facility";
import { useGetResidentsQuery } from "../../../../../../lib/queries/residents";
import type { Resident } from "../../../../../../lib/types/resident";
import type { Shift } from "../../../../../../lib/types/shifts";
import type { StaffMember } from "../../../../../../lib/types/staff";
import {
  SupportHoursRotaHeader,
  type RotaHeaderMetrics,
} from "./SupportHoursRotaHeader";
import {
  WeeklyRotaScheduleTable,
  type DayColumnInfo,
} from "./WeeklyRotaScheduleTable";
import { RotaSummaryWidgets } from "./RotaSummaryWidgets";
import { ShiftDetailsModal } from "./ShiftDetailsModal";
import {
  ModifyShiftBlockModal,
  type ShiftBlockFormData,
} from "./ModifyShiftBlockModal";
import { ReassignStaffModal } from "./ReassignStaffModal";
import { HoursSummaryView } from "./HoursSummaryView";
import { StaffAllocationView } from "./StaffAllocationView";
import {
  getCommissionedHours,
  getShiftDateStr,
  getShiftDeliveredHours,
  getShiftPlannedHours,
  resolveStaffLocation,
  roundHours,
} from "./rotaDataUtils";

export function RotaContainer(): React.JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tabParam = searchParams?.get("tab");

  const [currentWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [activeView, setActiveView] = useState<"rota" | "hours" | "allocation">(
    "rota",
  );
  const [activeCareType, setActiveCareType] = useState<string>("All Care Types");

  useEffect(() => {
    if (tabParam === "hours") setActiveView("hours");
    else if (tabParam === "allocation") setActiveView("allocation");
    else setActiveView("rota");
  }, [tabParam]);

  const handleViewChange = (nextView: "rota" | "hours" | "allocation"): void => {
    setActiveView(nextView);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (nextView === "rota") params.delete("tab");
    else params.set("tab", nextView);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const [detailsShift, setDetailsShift] = useState<Shift | null>(null);
  const [detailsContext, setDetailsContext] = useState<{
    staffName: string;
    staffRole?: string;
    dayLabel: string;
  }>({ staffName: "", dayLabel: "" });
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [slotToAdd, setSlotToAdd] = useState<{
    staff: StaffMember;
    day: DayColumnInfo;
  } | null>(null);
  const [reassignStaff, setReassignStaff] = useState<StaffMember | null>(null);

  const { data: shiftsData, isLoading: isShiftsLoading } = useGetShiftsQuery();
  const { data: staffData, isLoading: isStaffLoading } = useGetStaffQuery();
  const { data: schemes = [] } = useGetSchemesQuery();
  const { data: properties = [] } = useGetPropertiesQuery();
  const { data: residentsData } = useGetResidentsQuery();

  const updateShiftMutation = useUpdateShiftMutation();
  const createShiftMutation = useCreateShiftMutation();

  const shifts: Shift[] = useMemo(
    () => (Array.isArray(shiftsData) ? shiftsData : []),
    [shiftsData],
  );
  const staffList: StaffMember[] = useMemo(
    () => (Array.isArray(staffData) ? staffData : []),
    [staffData],
  );
  const residents: Resident[] = useMemo(
    () => (Array.isArray(residentsData) ? residentsData : []),
    [residentsData],
  );

  const days: DayColumnInfo[] = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(currentWeekStart, i);
        return {
          key: format(d, "yyyy-MM-dd"),
          dayName: format(d, "EEE"),
          dayNumber: format(d, "dd MMM"),
          dateStr: format(d, "yyyy-MM-dd"),
        };
      }),
    [currentWeekStart],
  );

  const weekShifts = useMemo(() => {
    const dayDateSet = new Set(days.map((d) => d.dateStr));
    return shifts.filter((s) => dayDateSet.has(getShiftDateStr(s)));
  }, [shifts, days]);

  const metrics: RotaHeaderMetrics = useMemo(() => {
    const commissionedHours = getCommissionedHours(schemes, residents);
    const plannedHours = roundHours(
      weekShifts.reduce((sum, s) => sum + getShiftPlannedHours(s), 0),
    );
    const deliveredHours = roundHours(
      weekShifts.reduce((sum, s) => sum + getShiftDeliveredHours(s), 0),
    );
    const completionRate =
      commissionedHours > 0
        ? Math.min(100, Math.round((deliveredHours / commissionedHours) * 100))
        : plannedHours > 0
          ? Math.min(100, Math.round((deliveredHours / plannedHours) * 100))
          : 0;

    return {
      peopleSupportedCount: residents.length,
      commissionedHours,
      deliveredHours,
      plannedHours,
      completionRate,
    };
  }, [schemes, residents, weekShifts]);

  const filteredShifts = useMemo(() => {
    if (activeCareType === "All Care Types") return weekShifts;
    return weekShifts.filter((s) => s.careType === activeCareType);
  }, [weekShifts, activeCareType]);

  const handleSaveShiftBlock = async (formData: ShiftBlockFormData) => {
    const residentIds = formData.residentIds ?? [];

    const resolveShiftDateTimes = (baseDateStr: string, windowStr?: string, durationHours?: number) => {
      let startDt = new Date(`${baseDateStr}T08:00:00Z`);
      let endDt = new Date(`${baseDateStr}T16:00:00Z`);

      const windowMatch = windowStr?.match(/(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})/);
      if (windowMatch) {
        const [, sh, sm, eh, em] = windowMatch;
        const startH = sh!.padStart(2, "0");
        const startM = sm!;
        const endH = eh!.padStart(2, "0");
        const endM = em!;
        startDt = new Date(`${baseDateStr}T${startH}:${startM}:00Z`);
        const isOvernight =
          Number(endH) < Number(startH) ||
          (Number(endH) === Number(startH) && Number(endM) <= Number(startM));
        if (isOvernight) {
          const nextDay = addDays(startDt, 1);
          endDt = new Date(`${format(nextDay, "yyyy-MM-dd")}T${endH}:${endM}:00Z`);
        } else {
          endDt = new Date(`${baseDateStr}T${endH}:${endM}:00Z`);
        }
      } else if (durationHours && durationHours > 0) {
        endDt = new Date(startDt.getTime() + durationHours * 3600 * 1000);
      }
      return { startTime: startDt.toISOString(), endTime: endDt.toISOString() };
    };

    if (editingShift) {
      const shiftDate = getShiftDateStr(editingShift) || format(new Date(editingShift.startTime), "yyyy-MM-dd");
      const { startTime, endTime } = resolveShiftDateTimes(shiftDate, formData.shiftWindow, formData.durationHours);
      await updateShiftMutation.mutateAsync({
        id: editingShift.id,
        careType: formData.careType,
        shiftWindow: formData.shiftWindow,
        durationHours: formData.durationHours,
        notes: formData.handoverNotes,
        residentIds,
        residentAssignmentConfirmed: true,
        startTime,
        endTime,
      });
      setEditingShift(null);
    } else if (slotToAdd) {
      const { startTime, endTime } = resolveShiftDateTimes(slotToAdd.day.dateStr, formData.shiftWindow, formData.durationHours);
      await createShiftMutation.mutateAsync({
        status: "Published",
        startTime,
        endTime,
        careType: formData.careType,
        shiftWindow: formData.shiftWindow,
        durationHours: formData.durationHours,
        notes: formData.handoverNotes,
        userIds: [slotToAdd.staff.id],
        residentIds,
        residentAssignmentConfirmed: true,
      });
      setSlotToAdd(null);
    }
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

  const selectedMonth = format(currentWeekStart, "MMMM yyyy");
  const selectedWeek = `${format(currentWeekStart, "dd MMM")} - ${format(addDays(currentWeekStart, 6), "dd MMM yyyy")}`;

  const reassignStaffData = reassignStaff
    ? (() => {
        const loc = resolveStaffLocation(reassignStaff, schemes, properties);
        return {
          id: reassignStaff.id,
          fullName: reassignStaff.fullName,
          email: reassignStaff.email,
          roleName: reassignStaff.role?.name,
          currentScheme: loc.schemeName ?? undefined,
          currentProperty: loc.propertyName ?? undefined,
          assignmentType: reassignStaff.contractType ?? undefined,
        };
      })()
    : null;

  return (
    <div className="space-y-6 pb-12 font-sans animate-in fade-in duration-300">
      <SupportHoursRotaHeader
        metrics={metrics}
        activeView={activeView}
        onViewChange={handleViewChange}
        activeCareType={activeCareType}
        onCareTypeChange={setActiveCareType}
        selectedMonth={selectedMonth}
        selectedWeek={selectedWeek}
        onCreateShift={() => {
          if (staffList[0] && days[0]) {
            setSlotToAdd({ staff: staffList[0], day: days[0] });
          }
        }}
        onExport={() => typeof window !== "undefined" && window.print()}
      />

      {activeView === "rota" && (
        <>
          <WeeklyRotaScheduleTable
            days={days}
            staffList={staffList}
            shifts={filteredShifts}
            schemes={schemes}
            properties={properties}
            activeCareTypeFilter={activeCareType}
            onSelectShift={(shift, staffName, dayLabel) => {
              const matchedStaff = staffList.find(
                (m) => m.fullName === staffName,
              );
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
            onReassignStaff={(staff) => setReassignStaff(staff)}
          />

          <RotaSummaryWidgets
            shifts={weekShifts}
            staffList={staffList}
            onViewHours={() => handleViewChange("hours")}
            onViewAllocation={() => handleViewChange("allocation")}
            onExportPdf={() => typeof window !== "undefined" && window.print()}
            onExportExcel={() => typeof window !== "undefined" && window.print()}
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
          activeCareType={activeCareType}
        />
      )}

      {activeView === "allocation" && (
        <StaffAllocationView
          schemes={schemes}
          properties={properties}
          staff={staffList}
          shifts={weekShifts}
          activeCareType={activeCareType}
          onReassignStaff={(staff) => setReassignStaff(staff)}
        />
      )}

      <ShiftDetailsModal
        open={Boolean(detailsShift)}
        onOpenChange={(open) => !open && setDetailsShift(null)}
        shift={detailsShift}
        staffName={detailsContext.staffName}
        staffRole={detailsContext.staffRole}
        dayLabel={detailsContext.dayLabel}
        residents={residents}
        schemes={schemes}
        properties={properties}
        onEditShift={(shift) => {
          setDetailsShift(null);
          setEditingShift(shift);
        }}
      />

      <ModifyShiftBlockModal
        open={Boolean(editingShift || slotToAdd)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingShift(null);
            setSlotToAdd(null);
          }
        }}
        shift={editingShift}
        staffName={
          editingShift ? detailsContext.staffName : slotToAdd?.staff.fullName
        }
        dayLabel={
          editingShift
            ? detailsContext.dayLabel
            : slotToAdd
              ? `${slotToAdd.day.dayName} ${slotToAdd.day.dayNumber}`
              : ""
        }
        residents={residents}
        onSave={handleSaveShiftBlock}
        isSaving={updateShiftMutation.isPending || createShiftMutation.isPending}
      />

      <ReassignStaffModal
        open={Boolean(reassignStaff)}
        onOpenChange={(open) => !open && setReassignStaff(null)}
        staff={reassignStaffData}
        schemes={schemes}
        properties={properties}
      />
    </div>
  );
}
