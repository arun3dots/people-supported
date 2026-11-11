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
import { EditCarePlanMasterDialog } from "../../../../../shared/components/EditCarePlanMasterDialog";
import { CarePlanDiffResponseDTO } from "@repo/schema";

interface ResidentCarePlanDialogsProps {
  residentId: string;
  activePlanId: string;
  planVersion: number;
  goals: Array<{ id: string; title: string }>;
  plan: unknown;

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
  selectedApproval: { id: string; role?: string } | null;
  onCloseApproval: () => void;
  onDecideApproval: (decision: "Approved" | "Rejected" | "ChangesRequested", comments?: string) => void;
  isApprovalLoading?: boolean;

  // Diff Viewer
  isDiffViewerOpen: boolean;
  onCloseDiff: () => void;
  diffData: CarePlanDiffResponseDTO | null;

  // Edit Master Dialog
  isEditMasterOpen: boolean;
  setIsEditMasterOpen: (open: boolean) => void;

  // Skip Modal
  skippingTask: { id: string; title: string } | null;
  onCloseSkip: () => void;
  onSubmitSkip: (reason: string) => void;
}

export function ResidentCarePlanDialogs({
  residentId,
  activePlanId,
  planVersion,
  goals,
  plan,
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
  isEditMasterOpen,
  setIsEditMasterOpen,
  skippingTask,
  onCloseSkip,
  onSubmitSkip,
}: ResidentCarePlanDialogsProps) {
  return (
    <>
      {isGoalDialogOpen ? (
        <CarePlanGoalDialog
          isOpen={isGoalDialogOpen}
          onClose={onCloseGoalDialog}
          onSubmit={onSubmitGoal}
          initialData={editingGoal || undefined}
          isLoading={isGoalLoading}
        />
      ) : null}

      {isTaskDialogOpen ? (
        <CarePlanTaskDialog
          isOpen={isTaskDialogOpen}
          onClose={onCloseTaskDialog}
          goals={goals}
          residentId={residentId}
          carePlanId={activePlanId}
          onSubmit={onSubmitTask}
          initialData={editingTask || undefined}
          isLoading={isTaskLoading}
        />
      ) : null}

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

      {isDiffViewerOpen && diffData ? (
        <CarePlanDiffViewer
          isOpen={isDiffViewerOpen}
          onClose={onCloseDiff}
          diffData={diffData}
        />
      ) : null}

      {isEditMasterOpen && plan ? (
        <EditCarePlanMasterDialog
          open={isEditMasterOpen}
          onOpenChange={setIsEditMasterOpen}
          residentId={residentId}
          carePlan={plan as Parameters<typeof EditCarePlanMasterDialog>[0]["carePlan"]}
        />
      ) : null}

      {skippingTask ? (
        <TaskSkipReasonModal
          isOpen={true}
          onClose={onCloseSkip}
          taskTitle={skippingTask.title}
          onSubmit={onSubmitSkip}
        />
      ) : null}
    </>
  );
}
