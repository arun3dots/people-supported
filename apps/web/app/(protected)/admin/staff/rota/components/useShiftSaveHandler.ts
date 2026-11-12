"use client";

import { addDays, format } from "date-fns";
import type { Shift } from "../../../../../../lib/types/shifts";
import type { StaffMember } from "../../../../../../lib/types/staff";
import type {
  useCreateShiftMutation,
  useUpdateShiftMutation,
} from "../../../../../../lib/queries/shifts";
import type { DayColumnInfo } from "./WeeklyRotaScheduleTable";
import type { ShiftBlockFormData } from "./ModifyShiftBlockModal";
import { getShiftDateStr } from "./rotaDataUtils";

export function resolveShiftDateTimes(
  baseDateStr: string,
  windowStr?: string,
  durationHours?: number,
): { startTime: string; endTime: string } {
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
}

interface SaveShiftParams {
  formData: ShiftBlockFormData;
  editingShift: Shift | null;
  slotToAdd: { staff: StaffMember; day: DayColumnInfo } | null;
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

  if (editingShift) {
    const shiftDate =
      formData.startDate ||
      getShiftDateStr(editingShift) ||
      format(new Date(editingShift.startTime), "yyyy-MM-dd");
    const { startTime, endTime } = resolveShiftDateTimes(
      shiftDate,
      formData.shiftWindow,
      formData.durationHours,
    );
    const targetUserIds =
      formData.userIds && formData.userIds.length > 0 ? formData.userIds : undefined;

    await updateShiftMutation.mutateAsync({
      id: editingShift.id,
      careType: formData.careType,
      shiftWindow: formData.shiftWindow,
      durationHours: formData.durationHours,
      notes: formData.handoverNotes,
      residentIds,
      ...(targetUserIds ? { userIds: targetUserIds } : {}),
      residentAssignmentConfirmed: true,
      startTime,
      endTime,
    });
  } else if (slotToAdd) {
    const targetDateStr = formData.startDate || slotToAdd.day.dateStr;
    const { startTime, endTime } = resolveShiftDateTimes(
      targetDateStr,
      formData.shiftWindow,
      formData.durationHours,
    );
    const targetUserIds =
      formData.userIds && formData.userIds.length > 0
        ? formData.userIds
        : [slotToAdd.staff.id];

    await createShiftMutation.mutateAsync({
      status: "Published",
      startTime,
      endTime,
      careType: formData.careType,
      shiftWindow: formData.shiftWindow,
      durationHours: formData.durationHours,
      notes: formData.handoverNotes,
      userIds: targetUserIds,
      residentIds,
      residentAssignmentConfirmed: true,
      ...(formData.endDate ? { repeatUntil: `${formData.endDate}T23:59:59Z` } : {}),
    });
  }
}
