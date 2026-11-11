"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import type { CareTaskRole } from "@repo/schema";

export interface TaskFormData {
  id?: string;
  residentId?: string;
  carePlanId?: string;
  goalId?: string | null;
  title: string;
  description?: string;
  instructions?: string;
  precautions?: string;
  category: string;
  frequency: string;
  timeOfDay: string[];
  targetTime?: string;
  startsOn?: string;
  endsOn?: string;
  recurrenceDays?: number[];
  priority: "Low" | "Medium" | "High" | "Critical";
  careTaskRole?: CareTaskRole;
  assignedStaffId?: string | null;
  requirePhotoOrNote?: boolean;
  escalateIfSkipped?: boolean;
}

const buildEmptyTaskForm = (
  residentId?: string,
  carePlanId?: string,
): TaskFormData => ({
  title: "",
  category: "Personal Care",
  frequency: "Daily",
  timeOfDay: ["Morning"],
  targetTime: "",
  startsOn: "",
  endsOn: "",
  recurrenceDays: [],
  priority: "Medium",
  careTaskRole: "Carer",
  instructions: "",
  precautions: "",
  goalId: null,
  residentId: residentId || "",
  carePlanId: carePlanId || "",
  assignedStaffId: null,
  requirePhotoOrNote: false,
  escalateIfSkipped: false,
});

interface UseCarePlanTaskFormOptions {
  initialData?: TaskFormData | null;
  isOpen: boolean;
  residentId?: string;
  carePlanId?: string;
  careJourneyMode: boolean;
  onSubmit: (data: TaskFormData) => void;
}

const CarePlanTaskSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),
    startsOn: z.string().optional(),
    endsOn: z.string().optional(),
    targetTime: z.string().optional(),
    timeOfDay: z.array(z.string()),
    frequency: z.string(),
    recurrenceDays: z.array(z.number()).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.startsOn && val.endsOn && val.endsOn < val.startsOn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateError"],
        message: "End date cannot be before start date",
      });
    }

    const trimmedTime = val.targetTime?.trim() ?? "";
    const hasValidTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(trimmedTime);
    const hasShift = val.timeOfDay.length > 0;

    if (trimmedTime.length > 0 && !hasValidTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["timeError"],
        message: "Enter a valid 24-hour target time",
      });
    } else if (!hasShift && !hasValidTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["timeError"],
        message: "Select at least one shift slot or choose a target time",
      });
    }
  });

export function useCarePlanTaskForm({
  initialData,
  isOpen,
  residentId,
  carePlanId,
  careJourneyMode,
  onSubmit,
}: UseCarePlanTaskFormOptions) {
  const [formData, setFormData] = useState<TaskFormData>(() =>
    buildEmptyTaskForm(residentId, carePlanId),
  );
  const [titleError, setTitleError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    setTitleError(null);
    setTimeError(null);
    setDateError(null);
    if (initialData) {
      setFormData({
        id: initialData.id,
        residentId: initialData.residentId || residentId || "",
        carePlanId: initialData.carePlanId || carePlanId || "",
        goalId: initialData.goalId !== undefined ? initialData.goalId : null,
        title: initialData.title || "",
        category: initialData.category || "Personal Care",
        frequency: initialData.frequency || "Daily",
        timeOfDay:
          initialData.timeOfDay && initialData.timeOfDay.length > 0
            ? initialData.timeOfDay
            : ["Morning"],
        targetTime: initialData.targetTime || "",
        startsOn: initialData.startsOn || "",
        endsOn: initialData.endsOn || "",
        recurrenceDays: initialData.recurrenceDays ?? [],
        priority: initialData.priority || "Medium",
        careTaskRole: initialData.careTaskRole ?? "Carer",
        instructions: initialData.instructions || initialData.description || "",
        precautions: initialData.precautions || "",
        assignedStaffId: initialData.assignedStaffId || null,
        requirePhotoOrNote: initialData.requirePhotoOrNote ?? false,
        escalateIfSkipped: initialData.escalateIfSkipped ?? false,
      });
    } else {
      setFormData(buildEmptyTaskForm(residentId, carePlanId));
    }
  }, [initialData, isOpen, residentId, carePlanId]);

  const clearScheduleErrors = () => {
    if (timeError) setTimeError(null);
    if (dateError) setDateError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTitleError(null);
    setTimeError(null);
    setDateError(null);

    const validation = CarePlanTaskSchema.safeParse({
      title: formData.title,
      startsOn: formData.startsOn,
      endsOn: formData.endsOn,
      targetTime: formData.targetTime,
      timeOfDay: formData.timeOfDay,
      frequency: formData.frequency,
      recurrenceDays: formData.recurrenceDays,
    });

    if (!validation.success) {
      for (const issue of validation.error.issues) {
        const field = issue.path[0]?.toString();
        if (field === "title") {
          setTitleError(`${careJourneyMode ? "Task" : "Routine"} title is required`);
        } else if (field === "dateError") {
          setDateError(issue.message);
        } else if (field === "timeError") {
          setTimeError(issue.message);
        }
      }
      return;
    }

    if (
      careJourneyMode &&
      formData.frequency === "Weekly" &&
      (formData.recurrenceDays ?? []).length === 0
    ) {
      setTimeError("Select at least one day of the week");
      return;
    }

    const trimmedTime = formData.targetTime?.trim() ?? "";
    onSubmit({
      ...formData,
      targetTime: trimmedTime,
      residentId: formData.residentId || residentId,
      carePlanId: formData.carePlanId || carePlanId,
      goalId: formData.goalId || null,
    });
  };

  return {
    formData,
    setFormData,
    titleError,
    setTitleError,
    timeError,
    dateError,
    clearScheduleErrors,
    handleSubmit,
  };
}
