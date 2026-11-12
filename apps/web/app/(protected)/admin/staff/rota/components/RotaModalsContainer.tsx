"use client";

import React from "react";
import { format } from "date-fns";
import type { PropertyItem, SchemeItem } from "../../../../../../lib/types/facility";
import type { Resident } from "../../../../../../lib/types/resident";
import type { Shift } from "../../../../../../lib/types/shifts";
import type { StaffMember } from "../../../../../../lib/types/staff";
import type { DayColumnInfo } from "./WeeklyRotaScheduleTable";
import { ShiftDetailsModal } from "./ShiftDetailsModal";
import { ModifyShiftBlockModal, type ShiftBlockFormData } from "./ModifyShiftBlockModal";
import { ReassignStaffModal } from "./ReassignStaffModal";
import { resolveStaffLocation } from "./rotaDataUtils";

interface RotaModalsContainerProps {
  detailsShift: Shift | null;
  onCloseDetails: () => void;
  detailsContext: { staffName: string; staffRole?: string; dayLabel: string };
  onEditFromDetails: (shift: Shift) => void;
  editingShift: Shift | null;
  slotToAdd: { staff: StaffMember; day: DayColumnInfo } | null;
  onCloseModify: () => void;
  onSaveShiftBlock: (formData: ShiftBlockFormData) => Promise<void>;
  isSavingShift: boolean;
  reassignStaff: StaffMember | null;
  onCloseReassign: () => void;
  staffList: StaffMember[];
  residents: Resident[];
  schemes: SchemeItem[];
  properties: PropertyItem[];
  isLocked?: boolean;
}

export function RotaModalsContainer({
  detailsShift,
  onCloseDetails,
  detailsContext,
  onEditFromDetails,
  editingShift,
  slotToAdd,
  onCloseModify,
  onSaveShiftBlock,
  isSavingShift,
  reassignStaff,
  onCloseReassign,
  staffList,
  residents,
  schemes,
  properties,
  isLocked = false,
}: RotaModalsContainerProps): React.JSX.Element {
  const isModifyOpen = Boolean(editingShift || slotToAdd);

  const modifyDayLabel = editingShift
    ? format(new Date(editingShift.startTime), "EEE dd MMM")
    : slotToAdd
      ? `${slotToAdd.day.dayName} ${slotToAdd.day.dayNumber}`
      : "";

  const modifyStaffName = editingShift
    ? staffList.find((s) => editingShift.userIds?.includes(s.id))?.fullName || "Staff"
    : slotToAdd?.staff.fullName || "Staff";

  const modifyStaffRole = editingShift
    ? staffList.find((s) => editingShift.userIds?.includes(s.id))?.role?.name
    : slotToAdd?.staff.role?.name;

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
    <>
      <ShiftDetailsModal
        open={Boolean(detailsShift)}
        onOpenChange={(open) => !open && onCloseDetails()}
        shift={detailsShift}
        staffName={detailsContext.staffName}
        staffRole={detailsContext.staffRole}
        dayLabel={detailsContext.dayLabel}
        residents={residents}
        schemes={schemes}
        properties={properties}
        isLocked={isLocked}
        onEditShift={onEditFromDetails}
      />

      <ModifyShiftBlockModal
        open={isModifyOpen}
        onOpenChange={(open) => !open && onCloseModify()}
        initialShift={editingShift}
        initialStaffId={slotToAdd?.staff.id}
        initialDateStr={slotToAdd?.day.dateStr}
        dayLabel={modifyDayLabel}
        staffName={modifyStaffName}
        staffRole={modifyStaffRole}
        staffList={staffList}
        residents={residents}
        schemes={schemes}
        properties={properties}
        onSave={onSaveShiftBlock}
        isSaving={isSavingShift}
      />

      <ReassignStaffModal
        open={Boolean(reassignStaff)}
        onOpenChange={(open) => !open && onCloseReassign()}
        staff={reassignStaffData}
        schemes={schemes}
        properties={properties}
      />
    </>
  );
}
