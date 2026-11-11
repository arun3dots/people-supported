"use client";

import { useState } from "react";
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
} from "../../../../../../lib/queries/care-plan";
import { useGetDailyTasksQuery } from "../../../../../../lib/queries/residents";
import {
  useGetResidentCapacityAssessmentsQuery,
  useGetResidentDolsQuery,
} from "../../../../../../lib/queries/mca-dols";
import { useGetStaffQuery } from "../../../../../../lib/queries/staff";
import { GoalFormData } from "../../../../../shared/components/care-plan/CarePlanGoalDialog";
import { TaskFormData } from "../../../../../shared/components/care-plan/CarePlanTaskDialog";
import { GoalItem, GoalTaskItem } from "../../../../../shared/components/care-plan/CarePlanGoalList";

export function useCarePlanDetailPage(planId: string) {
  const router = useRouter();

  // Modals & Dialogs State
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalFormData | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskFormData | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<{ id: string; role?: string } | null>(null);
  const [isDiffViewerOpen, setIsDiffViewerOpen] = useState(false);
  const [skippingTask, setSkippingTask] = useState<{ id: string; title: string } | null>(null);

  // Queries
  const { data: plan, isLoading: isPlanLoading } = useGetCarePlanDetailQuery(planId);
  const residentId = (plan as { residentId?: string })?.residentId || "";

  const { data: versions = [] } = useGetResidentCarePlanVersionsQuery(residentId);
  const { data: diffData } = useGetCarePlanDiffQuery(planId);
  const { data: rawDailyTasks = [] } = useGetDailyTasksQuery({
    residentId,
    date: new Date().toISOString().split("T")[0],
  });

  const dailyTasks = Array.isArray(rawDailyTasks)
    ? (rawDailyTasks as Array<{
        id: string;
        carePlanTaskId?: string | null;
        title: string;
        status: string;
        skipReason?: string;
        timeSlot?: string | null;
        targetTime?: string | null;
        category?: string | null;
        priority?: string | null;
        instructions?: string | null;
      }>)
    : [];

  // MCA & DoLS Queries for live governance badges
  const { data: rawAssessments = [] } = useGetResidentCapacityAssessmentsQuery(residentId);
  const assessments = Array.isArray(rawAssessments) ? rawAssessments : [];

  const { data: rawDols = [] } = useGetResidentDolsQuery(residentId);
  const dolsList = Array.isArray(rawDols) ? rawDols : [];
  const activeDols = dolsList.find(
    (d) => d.status === "Authorized" || d.status === "UrgentApplied"
  ) || null;

  // Staff query for approver/doctor names
  const { data: rawStaff = [] } = useGetStaffQuery();
  const staffList = Array.isArray(rawStaff)
    ? (rawStaff as Array<{ id: string; fullName: string }>)
    : [];

  // Mutations
  const submitMutation = useSubmitCarePlanMutation(planId);
  const decideApprovalMutation = useDecideCarePlanApprovalMutation(
    planId,
    selectedApproval?.id || ""
  );
  const createGoalMutation = useCreateCarePlanGoalMutation(planId);
  const updateGoalMutation = useUpdateCarePlanGoalMutation(editingGoal?.id || "", planId);
  const deleteGoalMutation = useDeleteCarePlanGoalMutation(editingGoal?.id || "", planId);
  const createTaskMutation = useCreateCarePlanTaskMutation(planId);
  const updateTaskMutation = useUpdateCarePlanTaskMutation(editingTask?.id || "", planId);
  const deleteTaskMutation = useDeleteCarePlanTaskMutation(editingTask?.id || "", planId);
  const updateDailyTaskMutation = useUpdateDailyTaskStatusMutation();

  const p = (plan || {}) as unknown as {
    id: string;
    versionNumber: number;
    status: string;
    validFrom: string | Date;
    validTo?: string | Date | null;
    nextReviewDate?: string | Date | null;
    description?: string | null;
    primaryDoctorId?: string | null;
    secondaryDoctorId?: string | null;
    authorRole?: string | null;
    departments?: string[];
    doctorsInvolved?: string[];
    resident?: {
      id?: string;
      fullName?: string;
      photoUrl?: string | null;
      dob?: string | Date | null;
      bed?: { room?: { roomNumber?: string } } | null;
      nhsNumber?: string;
    };
    goals?: GoalItem[];
    tasks?: Array<GoalTaskItem & { goalId?: string | null; category?: string; instructions?: string }>;
    approvals?: Array<{ id: string; role: string; decision: string; comments?: string | null }>;
    parentVersion?: { id: string; versionNumber: number } | null;
  };

  const isEditable =
    p.status !== "Expired" &&
    p.status !== "Superseded" &&
    p.status !== "expired" &&
    p.status !== "superseded";

  const primaryDoctorName =
    staffList.find((s) => s.id === p.primaryDoctorId)?.fullName || null;

  // Soft warning detection: Restrictive interventions without documented MCA
  const hasRestrictiveTasks = (p.tasks || []).some((t) => {
    const text = `${t.title || ""} ${t.instructions || ""}`.toLowerCase();
    return (
      text.includes("bed rail") ||
      text.includes("sensor mat") ||
      text.includes("covert") ||
      text.includes("keypad") ||
      text.includes("restraint")
    );
  });
  const restrictiveTasksWithoutMca = hasRestrictiveTasks && assessments.length === 0;

  return {
    residentId,
    router,
    plan,
    isPlanLoading,
    p,
    isEditable,
    versions,
    diffData,
    dailyTasks,
    assessments,
    dolsList,
    activeDols,
    primaryDoctorName,
    restrictiveTasksWithoutMca,
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
