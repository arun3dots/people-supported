"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  useGetCarePlanDetailQuery,
  useGetCarePlanDiffQuery,
  useGetResidentCarePlanVersionsQuery,
  useSubmitCarePlanMutation,
  useDecideCarePlanApprovalMutation,
  useCreateCarePlanGoalMutation,
  useUpdateCarePlanGoalMutation,
  useDeleteCarePlanGoalMutation,
  useCreateCarePlanTaskMutation,
  useUpdateCarePlanTaskMutation,
  useDeleteCarePlanTaskMutation,
  useUpdateDailyTaskStatusMutation,
} from "../../../../../../../lib/queries/care-plan";
import { useGetDailyTasksQuery } from "../../../../../../../lib/queries/residents";
import { GoalFormData } from "../../../../../../shared/components/care-plan/CarePlanGoalDialog";
import { TaskFormData } from "../../../../../../shared/components/care-plan/CarePlanTaskDialog";
import { GoalItem, GoalTaskItem } from "../../../../../../shared/components/care-plan/CarePlanGoalList";

interface UseResidentCarePlanTabProps {
  resident: Record<string, unknown> & {
    id: string;
    fullName?: string;
    carePlans?: Array<Record<string, unknown>>;
  };
}

export function useResidentCarePlanTab({ resident }: UseResidentCarePlanTabProps) {
  const residentId = resident.id;
  const router = useRouter();

  // 1. Fetch all versions of care plans for this resident
  const { data: rawVersions = [], isLoading: isVersionsLoading } =
    useGetResidentCarePlanVersionsQuery(residentId);
  const versions = Array.isArray(rawVersions)
    ? (rawVersions as Array<{ id: string; versionNumber: number; status: string }>)
    : [];

  // Determine initial care plan ID
  const initialPlanId = useMemo(() => {
    if (versions.length > 0) {
      const active = versions.find(
        (v) => v.status === "Active" || v.status === "active"
      );
      return active?.id || versions[0]?.id || "";
    }
    const inlinePlans = (resident.carePlans ?? []) as Array<Record<string, unknown>>;
    if (inlinePlans.length > 0) {
      const active = inlinePlans.find(
        (cp) => cp.status === "Active" || cp.status === "active"
      );
      return (active?.id as string) || (inlinePlans[0]?.id as string) || "";
    }
    return "";
  }, [versions, resident.carePlans]);

  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const activePlanId = selectedPlanId || initialPlanId;

  // Dialogs & Modals state
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalFormData | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskFormData | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<{ id: string; role?: string } | null>(null);
  const [isDiffViewerOpen, setIsDiffViewerOpen] = useState(false);
  const [isEditMasterOpen, setIsEditMasterOpen] = useState(false);
  const [skippingTask, setSkippingTask] = useState<{ id: string; title: string } | null>(null);

  // Queries
  const { data: planDetail, isLoading: isPlanLoading } =
    useGetCarePlanDetailQuery(activePlanId);
  const { data: diffData } = useGetCarePlanDiffQuery(activePlanId);
  const { data: rawDailyTasks = [] } = useGetDailyTasksQuery({
    residentId,
    date: new Date().toISOString().split("T")[0],
  });

  const dailyTasks = Array.isArray(rawDailyTasks)
    ? (rawDailyTasks as Array<{ id: string; title: string; status: string; skipReason?: string }>)
    : [];

  // Resolved Plan Data
  const plan =
    (planDetail as Record<string, unknown>) ||
    (resident.carePlans as Array<Record<string, unknown>>)?.find(
      (cp) => cp.id === activePlanId
    ) ||
    null;

  // Mutations
  const submitMutation = useSubmitCarePlanMutation(activePlanId);
  const decideApprovalMutation = useDecideCarePlanApprovalMutation(
    activePlanId,
    selectedApproval?.id || ""
  );
  const createGoalMutation = useCreateCarePlanGoalMutation(activePlanId);
  const updateGoalMutation = useUpdateCarePlanGoalMutation(editingGoal?.id || "", activePlanId);
  const deleteGoalMutation = useDeleteCarePlanGoalMutation(editingGoal?.id || "", activePlanId);
  const createTaskMutation = useCreateCarePlanTaskMutation(activePlanId);
  const updateTaskMutation = useUpdateCarePlanTaskMutation(editingTask?.id || "", activePlanId);
  const deleteTaskMutation = useDeleteCarePlanTaskMutation(editingTask?.id || "", activePlanId);
  const updateDailyTaskMutation = useUpdateDailyTaskStatusMutation();

  const p = (plan || {}) as {
    id?: string;
    status?: string;
    validTo?: string;
    versionNumber?: number;
    description?: string;
    goals?: GoalItem[];
    tasks?: GoalTaskItem[];
  };

  const isEditable =
    !p.status ||
    p.status === "Draft" ||
    p.status === "ChangesRequested" ||
    p.status === "draft" ||
    p.status === "changes_requested" ||
    p.status === "Returned for changes" ||
    (p.status !== "Expired" &&
      p.status !== "Superseded" &&
      p.status !== "PendingPrimaryApproval" &&
      p.status !== "PendingSecondaryApproval");

  const goals = p.goals || [];
  const tasks = p.tasks || [];
  const unassignedTasks = tasks.filter((t) => !(t as { goalId?: string }).goalId);

  return {
    residentId,
    router,
    versions,
    isVersionsLoading,
    isPlanLoading,
    activePlanId,
    setSelectedPlanId,
    plan,
    p,
    isEditable,
    goals,
    tasks,
    unassignedTasks,
    dailyTasks,
    diffData,
    isGoalDialogOpen,
    setIsGoalDialogOpen,
    editingGoal,
    setEditingGoal,
    isTaskDialogOpen,
    setIsTaskDialogOpen,
    editingTask,
    setEditingTask,
    isApprovalModalOpen,
    setIsApprovalModalOpen,
    selectedApproval,
    setSelectedApproval,
    isDiffViewerOpen,
    setIsDiffViewerOpen,
    isEditMasterOpen,
    setIsEditMasterOpen,
    skippingTask,
    setSkippingTask,
    submitMutation,
    decideApprovalMutation,
    createGoalMutation,
    updateGoalMutation,
    deleteGoalMutation,
    createTaskMutation,
    updateTaskMutation,
    deleteTaskMutation,
    updateDailyTaskMutation,
  };
}
