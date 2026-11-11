"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useGetCarePlanDetailQuery,
  useRenewCarePlanMutation,
} from "../../../../../../../lib/queries/care-plan";
import { useGetStaffQuery } from "../../../../../../../lib/queries/staff";
import { RenewalReason, TaskFrequency, GoalCategory, GoalReviewFrequency, GoalStatus } from "@repo/schema";
import { GoalFormData } from "../../../../../../shared/components/care-plan/CarePlanGoalDialog";
import { TaskFormData } from "../../../../../../shared/components/care-plan/CarePlanTaskDialog";

export interface ClonedGoal extends GoalFormData {
  originGoalId?: string;
  diffTag?: "CarriedOver" | "Changed" | "New" | "Retired";
}

export interface ClonedTask extends TaskFormData {
  originTaskId?: string;
  diffTag?: "CarriedOver" | "Changed" | "New" | "Removed";
  status?: string;
  isActive?: boolean;
}

export function useRenewCarePlanWizard(parentPlanId: string) {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [renewalReason, setRenewalReason] = useState<RenewalReason>("ScheduledReview");
  const [validFrom, setValidFrom] = useState(new Date().toISOString().split("T")[0]);
  const [validTo, setValidTo] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [description, setDescription] = useState("");
  const [primaryDoctorId, setPrimaryDoctorId] = useState("");
  const [secondaryDoctorId, setSecondaryDoctorId] = useState("");

  // Cloned Goals & Tasks
  const [goals, setGoals] = useState<ClonedGoal[]>([]);
  const [tasks, setTasks] = useState<ClonedTask[]>([]);

  // Dialogs
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalFormData | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskFormData | null>(null);

  const { data: parentPlan } = useGetCarePlanDetailQuery(parentPlanId);
  const { data: staffList = [] } = useGetStaffQuery();
  const renewMutation = useRenewCarePlanMutation(parentPlanId);

  useEffect(() => {
    if (parentPlan) {
      const p = parentPlan as {
        description?: string;
        primaryDoctorId?: string;
        authorId?: string;
        secondaryDoctorId?: string;
        goals?: Array<{ id: string; title: string; targetDescription: string; category?: string; reviewFrequency?: string; progressPercent?: number; status?: string }>;
        tasks?: Array<{ id: string; title: string; instructions?: string; precautions?: string; category?: string; frequency?: string; timeOfDay?: string[]; targetTime?: string; priority?: string; status?: string; isActive?: boolean; requirePhotoOrNote?: boolean; escalateIfSkipped?: boolean }>;
      };
      setDescription(p.description || "");
      setPrimaryDoctorId(p.primaryDoctorId || p.authorId || "");
      setSecondaryDoctorId(p.secondaryDoctorId || "");

      if (p.goals && goals.length === 0) {
        setGoals(
          p.goals
            .filter((g) => g.status !== "Retired" && g.status !== "retired")
            .map((g) => ({
              id: g.id,
              title: g.title,
              targetDescription: g.targetDescription,
              category: (g.category || "Mobility") as GoalCategory,
              reviewFrequency: (g.reviewFrequency || "Weekly") as GoalReviewFrequency,
              progressPercent: g.progressPercent || 0,
              status: (g.status || "Active") as GoalStatus,
              originGoalId: g.id,
              diffTag: "CarriedOver" as const,
            }))
        );
      }

      if (p.tasks && tasks.length === 0) {
        setTasks(
          p.tasks
            .filter((t) => t.status !== "Retired")
            .map((t) => ({
              id: t.id,
              title: t.title,
              instructions: t.instructions,
              precautions: t.precautions,
              category: t.category || "Personal Care",
              frequency: t.frequency || "Daily",
              timeOfDay: t.timeOfDay || ["Morning"],
              targetTime: t.targetTime,
              priority: (t.priority === "Critical" ? "Critical" : t.priority === "High" ? "High" : t.priority === "Low" ? "Low" : "Medium") as "Low" | "Medium" | "High" | "Critical",
              status: t.status || "Active",
              isActive: t.isActive ?? true,
              requirePhotoOrNote: t.requirePhotoOrNote ?? false,
              escalateIfSkipped: t.escalateIfSkipped ?? false,
              originTaskId: t.id,
              diffTag: "CarriedOver" as const,
            }))
        );
      }
    }
  }, [parentPlan, goals.length, tasks.length]);

  const handleSaveGoal = (data: GoalFormData) => {
    if (editingGoal) {
      setGoals((prev) =>
        prev.map((g) =>
          g.id === editingGoal.id ? { ...g, ...data, diffTag: g.originGoalId ? "Changed" : "New" } : g
        )
      );
    } else {
      setGoals((prev) => [...prev, { ...data, id: `goal-${Date.now()}`, diffTag: "New" }]);
    }
    setIsGoalDialogOpen(false);
  };

  const handleSaveTask = (data: TaskFormData) => {
    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id ? { ...t, ...data, diffTag: t.originTaskId ? "Changed" : "New" } : t
        )
      );
    } else {
      setTasks((prev) => [...prev, { ...data, id: `task-${Date.now()}`, diffTag: "New" }]);
    }
    setIsTaskDialogOpen(false);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!primaryDoctorId) return setError("Please assign a primary doctor");
    const activeGoals = goals.filter((g) => g.diffTag !== "Retired");
    const activeTasks = tasks.filter((t) => t.diffTag !== "Removed");
    if (activeGoals.length === 0) return setError("At least one active goal is required");
    if (activeTasks.length === 0) return setError("At least one active task is required");

    const secDocId =
      secondaryDoctorId && secondaryDoctorId !== "none" && secondaryDoctorId !== "NONE"
        ? secondaryDoctorId
        : undefined;

    try {
      await renewMutation.mutateAsync({
        renewalReason,
        validFrom: validFrom || new Date().toISOString(),
        validTo: validTo || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        description: description || undefined,
        primaryDoctorId,
        secondaryDoctorId: secDocId,
        goals: goals.map((g) => ({
          title: g.title,
          targetDescription: g.targetDescription,
          category: (g.category || "Mobility") as GoalCategory,
          reviewFrequency: (g.reviewFrequency || "Weekly") as GoalReviewFrequency,
          progressPercent: g.progressPercent || 0,
          status: (g.status || "Active") as GoalStatus,
          originGoalId: g.originGoalId,
          diffTag: g.diffTag,
        })),
        tasks: tasks.map((t) => ({
          title: t.title,
          instructions: t.instructions || undefined,
          precautions: t.precautions || undefined,
          category: t.category,
          frequency: (t.frequency || "Daily") as TaskFrequency,
          timeOfDay: t.timeOfDay,
          targetTime: t.targetTime || undefined,
          priority: (t.priority === "Critical" ? "Critical" : t.priority === "High" ? "High" : t.priority === "Low" ? "Low" : "Medium") as "Low" | "Medium" | "High" | "Critical",
          status: t.diffTag === "Removed" ? "Retired" : "Active",
          isActive: t.diffTag !== "Removed",
          requirePhotoOrNote: t.requirePhotoOrNote,
          escalateIfSkipped: t.escalateIfSkipped,
          originTaskId: t.originTaskId,
          diffTag: t.diffTag,
        })),
      });

      router.push(`/admin/care-plans/${parentPlanId}`);
    } catch (err: unknown) {
      const apiErr = err as { message?: string; errors?: Array<{ message?: string; path?: Array<string | number> }> };
      let errMsg = apiErr?.message || "Failed to create renewed care plan";
      if (Array.isArray(apiErr?.errors) && apiErr.errors.length > 0) {
        const details = apiErr.errors.map((e) => (e.path?.length ? `${e.path.join(".")}: ${e.message}` : e.message)).filter(Boolean).join(", ");
        if (details) errMsg = `${errMsg}: ${details}`;
      } else if (err instanceof Error) {
        errMsg = err.message;
      }
      setError(errMsg);
    }
  };

  return {
    router,
    currentStep,
    setCurrentStep,
    error,
    setError,
    renewalReason,
    setRenewalReason,
    validFrom,
    setValidFrom,
    validTo,
    setValidTo,
    description,
    setDescription,
    primaryDoctorId,
    setPrimaryDoctorId,
    secondaryDoctorId,
    setSecondaryDoctorId,
    goals,
    setGoals,
    tasks,
    setTasks,
    isGoalDialogOpen,
    setIsGoalDialogOpen,
    editingGoal,
    setEditingGoal,
    isTaskDialogOpen,
    setIsTaskDialogOpen,
    editingTask,
    setEditingTask,
    parentPlan,
    staffList,
    renewMutation,
    handleSaveGoal,
    handleSaveTask,
    handleSubmit,
  };
}
