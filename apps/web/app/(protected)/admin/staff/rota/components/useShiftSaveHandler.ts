"use client";

import type { Shift } from "../../../../../../lib/types/shifts";
import type { StaffMember } from "../../../../../../lib/types/staff";
import type {
  useCreateShiftMutation,
  useUpdateShiftMutation,
} from "../../../../../../lib/queries/shifts";
import type { DayColumnInfo } from "./WeeklyRotaScheduleTable";
import type { ShiftBlockFormData } from "./ModifyShiftBlockModal";

interface SaveShiftParams {
  formData: ShiftBlockFormData;
  editingShift: Shift | null;
  slotToAdd: { staff?: StaffMember; day?: DayColumnInfo } | null;
  createShiftMutation: ReturnType<typeof useCreateShiftMutation>;
  updateShiftMutation: ReturnType<typeof useUpdateShiftMutation>;
}

export async function executeSaveShiftBlock({
  formData,
  editingShift,
  slotToAdd,
  createShiftMutation,
  updateShiftMutation,
}: SaveShiftParams): Promise<void> {
  const residentIds = formData.residentIds ?? [];
  const wingId = formData.propertyId || undefined;

  if (editingShift) {
    const targetUserIds =
      formData.userIds && formData.userIds.length > 0 ? formData.userIds : undefined;

    await updateShiftMutation.mutateAsync({
      id: editingShift.id,
      careType: formData.careType,
      shiftWindow: formData.shiftWindow,
      durationHours: formData.durationHours,
      notes: formData.handoverNotes,
      wingId: wingId ?? "none",
      residentIds,
      ...(targetUserIds ? { userIds: targetUserIds } : {}),
      residentAssignmentConfirmed: true,
      startTime: formData.startTime,
      endTime: formData.endTime,
    });
  } else if (slotToAdd) {
    const targetUserIds =
      formData.userIds && formData.userIds.length > 0
        ? formData.userIds
        : [slotToAdd.staff.id];

    await createShiftMutation.mutateAsync({
      status: "Published",
      startTime: formData.startTime,
      endTime: formData.endTime,
      careType: formData.careType,
      shiftWindow: formData.shiftWindow,
      durationHours: formData.durationHours,
      notes: formData.handoverNotes,
      wingId,
      userIds: targetUserIds,
      residentIds,
      residentAssignmentConfirmed: true,
    });
  }
}
