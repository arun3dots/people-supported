import { z } from "zod";
import type { AssessmentAreaKey } from "./assessment";

const text = z.string().trim().nullable().optional();

export const CARE_TASK_SHIFTS = ["Day", "Night"] as const;
export const CareTaskShiftEnum = z.enum(CARE_TASK_SHIFTS);
export type CareTaskShift = z.infer<typeof CareTaskShiftEnum>;

export const CARE_TASK_ROLES = ["Carer", "Nurse"] as const;
export const CareTaskRoleEnum = z.enum(CARE_TASK_ROLES);
export type CareTaskRole = z.infer<typeof CareTaskRoleEnum>;

export const CARE_TASK_OUTCOMES = ["Done", "Declined"] as const;
export const CareTaskOutcomeEnum = z.enum(CARE_TASK_OUTCOMES);
export type CareTaskOutcome = z.infer<typeof CareTaskOutcomeEnum>;

const timeOfDay = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour time, e.g. 08:30");
const optionalTimeOfDay = z
  .union([timeOfDay, z.literal("")])
  .nullable()
  .optional();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const CareTaskRecurrenceSchema = z.object({
  type: z.enum(["daily", "weekly"]).default("daily"),
  // 0 = Sunday. Only used for weekly tasks.
  days: z.array(z.number().int().min(0).max(6)).default([]),
});
export type CareTaskRecurrenceDTO = z.infer<typeof CareTaskRecurrenceSchema>;

const CreateCareTaskBaseSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: text,
  shift: CareTaskShiftEnum.optional(),
  time: optionalTimeOfDay,
  role: CareTaskRoleEnum.default("Carer"),
  recurrence: CareTaskRecurrenceSchema.default({ type: "daily", days: [] }),
  startsOn: isoDate.nullable().optional(),
  endsOn: isoDate.nullable().optional(),
});

export const CreateCareTaskSchema = CreateCareTaskBaseSchema.superRefine(
  (data, ctx) => {
    const hasTime = Boolean(data.time && data.time.trim().length > 0);
    if (!hasTime && !data.shift) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["time"],
        message: "Select a shift or choose a task time",
      });
    }
    if (data.startsOn && data.endsOn && data.endsOn < data.startsOn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsOn"],
        message: "End date cannot be before start date",
      });
    }
  },
);
export type CreateCareTaskDTO = z.infer<typeof CreateCareTaskSchema>;

export const UpdateCareTaskSchema = CreateCareTaskBaseSchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type UpdateCareTaskDTO = z.infer<typeof UpdateCareTaskSchema>;

export const RecordCareTaskSchema = z.object({
  outcome: CareTaskOutcomeEnum,
  note: text,
  date: isoDate.optional(),
});
export type RecordCareTaskDTO = z.infer<typeof RecordCareTaskSchema>;

export const CareTaskDayQuerySchema = z.object({
  date: isoDate.optional(),
  shift: CareTaskShiftEnum.optional(),
});
export type CareTaskDayQueryDTO = z.infer<typeof CareTaskDayQuerySchema>;

export const CareTaskBoardQuerySchema = z.object({
  date: isoDate.optional(),
});
export type CareTaskBoardQueryDTO = z.infer<typeof CareTaskBoardQuerySchema>;

export type CareTaskBoardStatus = "Pending" | "Completed" | "Skipped";

export interface CareTaskBoardItemDTO {
  taskId: string;
  residentId: string;
  title: string;
  status: CareTaskBoardStatus;
  timeSlot: CareTaskShift;
  targetTime: string | null;
  role: CareTaskRole;
  instructions: string | null;
  skipReason: string | null;
  resident: { id: string; fullName: string };
  carePlan: { id: string; area: string };
}

export interface CareTaskBoardDTO {
  date: string;
  items: CareTaskBoardItemDTO[];
}

export const UndoCareTaskSchema = z.object({ date: isoDate.optional() });
export type UndoCareTaskDTO = z.infer<typeof UndoCareTaskSchema>;

export const CreateShiftNoteSchema = z.object({
  shift: CareTaskShiftEnum,
  text: z.string().trim().min(1, "Note cannot be empty").max(2000),
  date: isoDate.optional(),
});
export type CreateShiftNoteDTO = z.infer<typeof CreateShiftNoteSchema>;

// Shift hours: Day 06:00-20:59, Night otherwise. Used when shift is not given.
export const shiftForTime = (time: string): CareTaskShift => {
  const hour = Number(time.slice(0, 2));
  return hour >= 6 && hour < 21 ? "Day" : "Night";
};

export interface CareTaskDefinitionDTO {
  id: string;
  carePlanId: string;
  areaKey: AssessmentAreaKey;
  area: string;
  stepIndex: number | null; // Legacy metadata from tasks generated from support steps.
  title: string;
  description: string | null;
  shift: CareTaskShift;
  time: string;
  role: CareTaskRole;
  recurrence: CareTaskRecurrenceDTO;
  isActive: boolean;
  startsOn: string | null;
  endsOn: string | null;
}

export interface CareTaskRecordSummaryDTO {
  id: string;
  outcome: CareTaskOutcome;
  note: string | null;
  recordedAt: string;
  recordedByName: string | null;
}

export type CareTaskStatus = "Pending" | "Done" | "Declined";

export interface CareTaskListItemDTO {
  taskId: string;
  time: string;
  shift: CareTaskShift;
  title: string;
  description: string | null;
  role: CareTaskRole;
  carePlan: { id: string; areaKey: AssessmentAreaKey; area: string };
  status: CareTaskStatus;
  record: CareTaskRecordSummaryDTO | null;
}

export interface ShiftNoteDTO {
  id: string;
  date: string;
  shift: CareTaskShift;
  text: string;
  authorName: string | null;
  createdAt: string;
}

export interface MustKnowItemDTO {
  label: string;
  value: string;
  tone: "neutral" | "warning" | "danger";
}

export interface CareTaskDayDTO {
  residentId: string;
  date: string;
  shift: CareTaskShift;
  items: CareTaskListItemDTO[];
  progress: { recorded: number; total: number };
  mustKnow: MustKnowItemDTO[];
  notes: ShiftNoteDTO[];
}
