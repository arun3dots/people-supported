import {
  shiftForTime,
  type CareTaskRecurrenceDTO,
  type CareTaskShift,
  type CreateCareTaskDTO,
} from "@repo/schema";
import type { TaskFormData } from "../../../../shared/components/care-plan/CarePlanTaskDialog";

export function careJourneyTaskFromForm(data: TaskFormData): CreateCareTaskDTO {
  const rawTime = data.targetTime?.trim() ?? "";
  const hasValidTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(rawTime);
  const slots = data.timeOfDay ?? [];
  const hasDaySlot = slots.some(
    (slot) =>
      slot === "Morning" ||
      slot === "Afternoon" ||
      slot === "Evening" ||
      slot === "AllDay",
  );
  const shift: CareTaskShift = hasValidTime
    ? shiftForTime(rawTime)
    : !hasDaySlot && slots.includes("Night")
      ? "Night"
      : "Day";

  const instructions = data.instructions?.trim();
  const precautions = data.precautions?.trim();
  const description = [
    instructions,
    precautions ? `Precautions: ${precautions}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const startsOn = data.startsOn?.trim() || undefined;
  const endsOn = data.endsOn?.trim() || undefined;
  const recurrence: CareTaskRecurrenceDTO =
    data.frequency === "Weekly" && (data.recurrenceDays ?? []).length > 0
      ? { type: "weekly", days: data.recurrenceDays ?? [] }
      : { type: "daily", days: [] };

  return {
    title: data.title.trim(),
    description: description || null,
    time: hasValidTime ? rawTime : "",
    shift,
    role: data.careTaskRole ?? "Carer",
    recurrence,
    ...(startsOn ? { startsOn } : {}),
    ...(endsOn ? { endsOn } : {}),
  };
}
