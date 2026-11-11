"use client";

import React, { useState, useMemo, useEffect } from "react";
import { format, startOfWeek, addDays } from "date-fns";
import { useSearchParams } from "next/navigation";
import { Spinner, Text } from "@repo/ui/components/ui";
import { useGetShiftsQuery, useUpdateShiftMutation, useCreateShiftMutation } from "../../../../../../lib/queries/shifts";
import { useGetStaffQuery } from "../../../../../../lib/queries/staff";
import { useGetSchemesQuery, useGetPropertiesQuery } from "../../../../../../lib/queries/facility";
import { useGetResidentsQuery } from "../../../../../../lib/queries/residents";
import type { Shift } from "../../../../../../lib/types/shifts";
import type { StaffMember } from "../../../../../../lib/types/staff";
import { SupportHoursRotaHeader, type RotaHeaderMetrics } from "./SupportHoursRotaHeader";
import { WeeklyRotaScheduleTable, type DayColumnInfo } from "./WeeklyRotaScheduleTable";
import { RotaSummaryWidgets } from "./RotaSummaryWidgets";
import { ShiftDetailsModal } from "./ShiftDetailsModal";
import { ModifyShiftBlockModal, type ShiftBlockFormData } from "./ModifyShiftBlockModal";
import { ReassignStaffModal } from "./ReassignStaffModal";
import { HoursSummaryView } from "./HoursSummaryView";
import { StaffAllocationView } from "./StaffAllocationView";

export function RotaContainer(): React.JSX.Element {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [activeView, setActiveView] = useState<"rota" | "hours" | "allocation">("rota");
  const [activeCareType, setActiveCareType] = useState<string>("All Care Types");

  useEffect(() => {
    if (tabParam === "hours") setActiveView("hours");
    else if (tabParam === "allocation") setActiveView("allocation");
  }, [tabParam]);

  // Modal States
  const [detailsShift, setDetailsShift] = useState<Shift | null>(null);
  const [detailsContext, setDetailsContext] = useState<{ staffName: string; dayLabel: string }>({
    staffName: "",
    dayLabel: "",
  });
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [slotToAdd, setSlotToAdd] = useState<{ staff: StaffMember; day: DayColumnInfo } | null>(null);
  const [reassignStaff, setReassignStaff] = useState<StaffMember | null>(null);

  // Queries
  const { data: shiftsData, isLoading: isShiftsLoading } = useGetShiftsQuery();
  const { data: staffData, isLoading: isStaffLoading } = useGetStaffQuery();
  const { data: schemes = [] } = useGetSchemesQuery();
  const { data: properties = [] } = useGetPropertiesQuery();
  const { data: residentsData } = useGetResidentsQuery();

  const updateShiftMutation = useUpdateShiftMutation();
  const createShiftMutation = useCreateShiftMutation();

  const shifts: Shift[] = useMemo(() => (Array.isArray(shiftsData) ? shiftsData : []), [shiftsData]);
  const staffList: StaffMember[] = useMemo(
    () => (Array.isArray(staffData) ? staffData : []),
    [staffData],
  );

  // Build the 7 day columns (Mon–Sun)
  const days: DayColumnInfo[] = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(currentWeekStart, i);
      return {
        key: format(d, "yyyy-MM-dd"),
        dayName: format(d, "EEE"),
        dayNumber: format(d, "dd MMM"),
        dateStr: format(d, "yyyy-MM-dd"),
      };
    });
  }, [currentWeekStart]);

  const metrics: RotaHeaderMetrics = useMemo(() => {
    const peopleCount = Array.isArray(residentsData) ? residentsData.length : 24;
    return {
      peopleSupportedCount: peopleCount,
      commissionedHours: 320,
      deliveredHours: 295,
      completionRate: 92,
    };
  }, [residentsData]);

  // Filter shifts based on active care type pill if selected
  const filteredShifts = useMemo(() => {
    if (activeCareType === "All Care Types") return shifts;
    return shifts.filter((s) => s.careType === activeCareType);
  }, [shifts, activeCareType]);

  const handleSaveShiftBlock = async (formData: ShiftBlockFormData) => {
    const residentIds =
      formData.residentIds && formData.residentIds.length > 0
        ? formData.residentIds
        : Array.isArray(residentsData) && residentsData[0]
          ? [residentsData[0].id]
          : [];

    if (editingShift) {
      await updateShiftMutation.mutateAsync({
        id: editingShift.id,
        careType: formData.careType,
        shiftWindow: formData.shiftWindow,
        durationHours: formData.durationHours,
        notes: formData.handoverNotes,
        residentIds,
      });
      setEditingShift(null);
    } else if (slotToAdd) {
      const startDateTime = new Date(`${slotToAdd.day.dateStr}T08:00:00Z`);
      const endDateTime = new Date(`${slotToAdd.day.dateStr}T16:00:00Z`);
      await createShiftMutation.mutateAsync({
        status: "Published",
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        careType: formData.careType,
        shiftWindow: formData.shiftWindow,
        durationHours: formData.durationHours,
        notes: formData.handoverNotes,
        userIds: [slotToAdd.staff.id],
        residentIds,
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

  return (
    <div className="space-y-6 pb-12 font-sans animate-in fade-in duration-300">
      <SupportHoursRotaHeader
        metrics={metrics}
        activeView={activeView}
        onViewChange={setActiveView}
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
            activeCareTypeFilter={activeCareType}
            onSelectShift={(shift, staffName, dayLabel) => {
              setDetailsShift(shift);
              setDetailsContext({ staffName, dayLabel });
            }}
            onAddShiftBlock={(staff, day) => {
              setEditingShift(null);
              setSlotToAdd({ staff, day });
            }}
            onReassignStaff={(staff) => setReassignStaff(staff)}
          />

          <RotaSummaryWidgets
            totalHours={metrics.commissionedHours}
            onExportPdf={() => typeof window !== "undefined" && window.print()}
            onExportExcel={() => typeof window !== "undefined" && window.print()}
          />
        </>
      )}

      {activeView === "hours" && (
        <HoursSummaryView
          shifts={shifts}
          schemes={schemes}
          properties={properties}
          staff={staffList}
          activeCareType={activeCareType}
        />
      )}

      {activeView === "allocation" && (
        <StaffAllocationView
          schemes={schemes}
          properties={properties}
          staff={staffList}
          activeCareType={activeCareType}
          onReassignStaff={(staff) => setReassignStaff(staff)}
        />
      )}

      {/* Shift Details Modal (Screenshot 6 Dialog) */}
      <ShiftDetailsModal
        open={Boolean(detailsShift)}
        onOpenChange={(open) => !open && setDetailsShift(null)}
        shift={detailsShift}
        staffName={detailsContext.staffName}
        dayLabel={detailsContext.dayLabel}
        onEditShift={(shift) => {
          setDetailsShift(null);
          setEditingShift(shift);
        }}
      />

      {/* Modify/Add Shift Block Modal (Screenshot 7 & 8 Dialog) */}
      <ModifyShiftBlockModal
        open={Boolean(editingShift || slotToAdd)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingShift(null);
            setSlotToAdd(null);
          }
        }}
        shift={editingShift}
        staffName={editingShift ? detailsContext.staffName : slotToAdd?.staff.fullName}
        dayLabel={editingShift ? detailsContext.dayLabel : slotToAdd ? `${slotToAdd.day.dayName} ${slotToAdd.day.dayNumber}` : ""}
        residents={Array.isArray(residentsData) ? residentsData : []}
        onSave={handleSaveShiftBlock}
        isSaving={updateShiftMutation.isPending || createShiftMutation.isPending}
      />

      {/* Reassign Staff Work Modal (Screenshot 4 Dialog) */}
      <ReassignStaffModal
        open={Boolean(reassignStaff)}
        onOpenChange={(open) => !open && setReassignStaff(null)}
        staff={
          reassignStaff
            ? {
                id: reassignStaff.id,
                fullName: reassignStaff.fullName,
                roleName: reassignStaff.role?.name,
                currentScheme: schemes[0]?.name,
                currentProperty: reassignStaff.assignedWings?.[0]?.name,
              }
            : null
        }
        schemes={schemes}
        properties={properties}
      />
    </div>
  );
}
