"use client";


import {
  CarePlanGoalDialog,
  GoalFormData,
} from "../../../../../shared/components/care-plan/CarePlanGoalDialog";
import {
  CarePlanTaskDialog,
  TaskFormData,
} from "../../../../../shared/components/care-plan/CarePlanTaskDialog";
import { CarePlanApprovalModal } from "../../../../../shared/components/care-plan/CarePlanApprovalModal";
import { CarePlanDiffViewer } from "../../../../../shared/components/care-plan/CarePlanDiffViewer";
import { TaskSkipReasonModal } from "../../../../../shared/components/care-plan/TaskSkipReasonModal";
import { MonthlyReviewModal } from "./MonthlyReviewModal";
import { ClinicalCalculatorsModal } from "./ClinicalCalculatorsModal";
import { HospitalTransferPackModal } from "./HospitalTransferPackModal";
import { CarePlanDiffResponseDTO } from "@repo/schema";

interface CarePlanDetailDialogsProps {
  planId: string;
  residentId: string;
  residentName: string;
  planVersion: number;
  goals: Array<{ id: string; title: string }>;

  // Goal Dialog
  isGoalDialogOpen: boolean;
  onCloseGoalDialog: () => void;
  onSubmitGoal: (data: GoalFormData) => void;
  editingGoal: GoalFormData | null;
  isGoalLoading?: boolean;

  // Task Dialog
  isTaskDialogOpen: boolean;
  onCloseTaskDialog: () => void;
  onSubmitTask: (data: TaskFormData) => void;
  editingTask: TaskFormData | null;
  isTaskLoading?: boolean;

  // Approval Modal
  isApprovalModalOpen: boolean;
  selectedApproval: {
    id: string;
    role?: string;
    decision?: string;
  } | null;
  onCloseApproval: () => void;
  onDecideApproval: (decision: "Approved" | "Rejected" | "ChangesRequested", comments?: string) => void;
  isApprovalLoading?: boolean;

  // Diff Viewer
  isDiffViewerOpen: boolean;
  onCloseDiff: () => void;
  diffData: CarePlanDiffResponseDTO | null;

  // Skip Reason Modal
  skippingTask: { id: string; title: string } | null;
  onCloseSkip: () => void;
  onSubmitSkip: (reason: string) => void;

  // Monthly Review Modal
  isReviewModalOpen: boolean;
  onCloseReview: () => void;

  // Clinical Calculators Modal
  isCalculatorsModalOpen?: boolean;
  onCloseCalculators?: () => void;

  // Hospital Transfer Pack (e-RedBag) Modal
  isTransferPackOpen?: boolean;
  onCloseTransferPack?: () => void;
}

export function CarePlanDetailDialogs({
  planId,
  residentId,
  residentName,
  planVersion,
  goals,
  isGoalDialogOpen,
  onCloseGoalDialog,
  onSubmitGoal,
  editingGoal,
  isGoalLoading,
  isTaskDialogOpen,
  onCloseTaskDialog,
  onSubmitTask,
  editingTask,
  isTaskLoading,
  isApprovalModalOpen,
  selectedApproval,
  onCloseApproval,
  onDecideApproval,
  isApprovalLoading,
  isDiffViewerOpen,
  onCloseDiff,
  diffData,
  skippingTask,
  onCloseSkip,
  onSubmitSkip,
  isReviewModalOpen,
  onCloseReview,
  isCalculatorsModalOpen,
  onCloseCalculators,
  isTransferPackOpen,
  onCloseTransferPack,
}: CarePlanDetailDialogsProps) {
  return (
    <>
      {/* Goal Dialog Modal */}
      {isGoalDialogOpen ? (
        <CarePlanGoalDialog
          isOpen={isGoalDialogOpen}
          onClose={onCloseGoalDialog}
          onSubmit={onSubmitGoal}
          initialData={editingGoal || undefined}
          isLoading={isGoalLoading}
        />
      ) : null}

      {/* Task Dialog Modal */}
      {isTaskDialogOpen ? (
        <CarePlanTaskDialog
          isOpen={isTaskDialogOpen}
          onClose={onCloseTaskDialog}
          goals={goals}
          residentId={residentId}
          carePlanId={planId}
          onSubmit={onSubmitTask}
          initialData={editingTask || undefined}
          isLoading={isTaskLoading}
        />
      ) : null}

      {/* Approval Decision Modal */}
      {isApprovalModalOpen && selectedApproval ? (
        <CarePlanApprovalModal
          isOpen={isApprovalModalOpen}
          onClose={onCloseApproval}
          role={selectedApproval.role || "Primary"}
          planVersion={planVersion}
          onDecide={onDecideApproval}
          isLoading={isApprovalLoading}
        />
      ) : null}

      {/* Version Diff Viewer Modal */}
      {isDiffViewerOpen ? (
        <CarePlanDiffViewer
          isOpen={isDiffViewerOpen}
          onClose={onCloseDiff}
          diffData={diffData}
        />
      ) : null}

      {/* Task Skip Reason Modal */}
      {skippingTask ? (
        <TaskSkipReasonModal
          isOpen={true}
          onClose={onCloseSkip}
          taskTitle={skippingTask.title}
          onSubmit={onSubmitSkip}
        />
      ) : null}

      {/* Monthly Evaluation Modal (CQC Reg 17) */}
      {isReviewModalOpen ? (
        <MonthlyReviewModal
          isOpen={isReviewModalOpen}
          onClose={onCloseReview}
          carePlanId={planId}
          residentName={residentName}
        />
      ) : null}

      {/* NHS / NICE Clinical Calculators Modal (MUST & Waterlow) */}
      {isCalculatorsModalOpen && onCloseCalculators ? (
        <ClinicalCalculatorsModal
          isOpen={isCalculatorsModalOpen}
          onClose={onCloseCalculators}
          residentName={residentName}
        />
      ) : null}

      {/* NHS Hospital Transfer Pack (e-RedBag) Modal */}
      {isTransferPackOpen && onCloseTransferPack ? (
        <HospitalTransferPackModal
          isOpen={isTransferPackOpen}
          onClose={onCloseTransferPack}
          residentId={residentId}
        />
      ) : null}
    </>
  );
}
