"use client";

import React, { useState } from "react";
import { Badge, Button, Card, Text } from "@repo/ui/components/ui";
import { FileText, Plus, Loader2, Eye } from "lucide-react";
import { ExpiredRenewalBanner } from "../../../../../shared/components/care-plan/ExpiredRenewalBanner";
import { GoalTaskItem } from "../../../../../shared/components/care-plan/CarePlanGoalList";
import { GoalFormData } from "../../../../../shared/components/care-plan/CarePlanGoalDialog";
import { TaskFormData } from "../../../../../shared/components/care-plan/CarePlanTaskDialog";
import { CarePlanSectionNav } from "./CarePlanSectionNav";
import { CarePlanMainSection } from "./CarePlanMainSection";
import { ResidentCarePlanDialogs } from "./ResidentCarePlanDialogs";
import { useResidentCarePlanTab } from "./hooks/useResidentCarePlanTab";
import {
  GoalCategory,
  GoalReviewFrequency,
  GoalStatus,
  TaskFrequency,
  CarePlanDiffResponseDTO,
} from "@repo/schema";

interface ResidentCarePlanTabProps {
  resident: Record<string, unknown> & {
    id: string;
    fullName?: string;
    carePlans?: Array<Record<string, unknown>>;
  };
}

export function ResidentCarePlanTab({ resident }: ResidentCarePlanTabProps): React.JSX.Element {
  const {
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
  } = useResidentCarePlanTab({ resident });

  const [activeSection, setActiveSection] = useState("goals");

  // Loading state
  if ((isVersionsLoading || isPlanLoading) && !plan && !!activePlanId) {
    return (
      <Card variant="surface" className="p-12 text-center font-sans">
        <Loader2 className="size-7 animate-spin text-emerald-800 mx-auto mb-2" />
        <Text size="md" weight="medium" variant="muted">Loading care plan details...</Text>
      </Card>
    );
  }

  // Empty state when resident has no care plans
  if (!plan && !activePlanId) {
    return (
      <Card variant="surface" className="p-8 lg:p-12 text-center gap-4 font-sans border border-dashed border-slate-200">
        <div className="size-14 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto">
          <FileText className="size-7" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <Text as="h3" size="md" weight="bold" className="text-slate-900">
            No Care Plan Created Yet
          </Text>
          <Text size="md" variant="muted">
            This tenant does not have a registered care plan. Create a master
            support plan to define goals, intervention tasks, and assign supported workers.
          </Text>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => router.push(`/admin/care-plans/new?residentId=${residentId}`)}
          className="rounded-xl gap-1.5 h-9 text-md font-semibold mx-auto"
        >
          <Plus className="size-4" /> Create Master Care Plan
        </Button>
      </Card>
    );
  }

  const isSubmittable =
    p.status === "Draft" ||
    p.status === "ChangesRequested" ||
    p.status === "draft" ||
    p.status === "changes_requested";

  const isChangesRequested =
    p.status === "ChangesRequested" ||
    p.status === "changes_requested" ||
    p.status === "Returned for changes";

  return (
    <div className="space-y-4 font-sans animate-in fade-in duration-200">
      {/* Top Revision / Status Action Bar */}
      <Card
        variant="surface"
        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 gap-3"
      >
        <div className="flex items-center gap-2 flex-wrap text-md">
          <Text size="md" weight="bold" className="font-mono text-slate-800">
            {p.versionNumber ? `CP-${String(p.versionNumber).padStart(4, "0")}` : "CP-0001"}
          </Text>
          <Badge
            variant="secondary"
            state={p.status === "Active" ? "success" : isChangesRequested ? "danger" : "warning"}
            className="font-semibold px-2 py-0.5 text-md"
          >
            {p.status || "Draft"}
          </Badge>
          <Text size="md" variant="muted">·</Text>
          <Text size="md" variant="muted" className="text-slate-600">
            {p.status === "Active"
              ? `Approved version v${p.versionNumber || 1} · Active`
              : `Working revision rev ${p.versionNumber || 1} · not yet approved`}
          </Text>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {isSubmittable && (
            <>
              <Badge
                variant="secondary"
                state="success"
              >
                All changes saved - rev {p.versionNumber || 1}
              </Badge>
              <Button
                variant="primary"
                size="sm"
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? "Submitting..." : "Submit for review"}
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveSection("version_history")}
          >
            Version history
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/care-plans/${activePlanId}`)}
          >
            <Eye className="size-3.5" />
            Clinical View
          </Button>
        </div>
      </Card>

      {/* Return notice / revision banner - only show if changes were requested */}
      {isChangesRequested && (
        <Text variant="muted" weight="medium" size="md" className="p-3 sm:px-4 rounded-xl bg-amber-50/90 border border-amber-200 text-md text-amber-900 leading-relaxed font-medium">
          {p?.description || "Changes requested by reviewer. Please update the necessary sections and resubmit for approval."}
        </Text>
      )}

      {/* Expired / Expiring Warning Banner with Renew CTA if relevant */}
      <ExpiredRenewalBanner
        status={p.status || "Draft"}
        validTo={p.validTo || ""}
        onRenew={() => router.push(`/admin/care-plans/${activePlanId}/renew`)}
      />

      {/* 3-Column Layout: Left Nav Sidebar, Center Content, Right Resident Context */}
      <div className="flex flex-col lg:flex-row items-start gap-4">
        <CarePlanSectionNav
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          goalCount={goals.length}
          taskCount={tasks.length}
        />

        <CarePlanMainSection
          activeSection={activeSection}
          resident={resident}
          plan={p}
          goals={goals}
          tasks={tasks}
          unassignedTasks={unassignedTasks}
          dailyTasks={dailyTasks}
          isEditable={isEditable}
          versions={versions}
          onSelectVersion={(verId) => setSelectedPlanId(verId)}
          onAddGoal={() => {
            setEditingGoal(null);
            setIsGoalDialogOpen(true);
          }}
          onEditGoal={(goal) => {
            setEditingGoal(goal as unknown as GoalFormData);
            setIsGoalDialogOpen(true);
          }}
          onDeleteGoal={(id) => {
            setEditingGoal({ id } as unknown as GoalFormData);
            deleteGoalMutation.mutate();
          }}
          onAddTaskToGoal={(goalId) => {
            setEditingTask({
              goalId: goalId || null,
              title: "",
              category: "Personal Care",
              frequency: "Daily",
              timeOfDay: ["Morning"],
            } as unknown as TaskFormData);
            setIsTaskDialogOpen(true);
          }}
          onEditTask={(task) => {
            setEditingTask(task as unknown as TaskFormData);
            setIsTaskDialogOpen(true);
          }}
          onDeleteTask={(taskId) => {
            setEditingTask({ id: taskId } as unknown as TaskFormData);
            deleteTaskMutation.mutate();
          }}
          onCompleteDailyTask={(id) =>
            updateDailyTaskMutation.mutate({
              taskId: id,
              data: { status: "Completed" },
            })
          }
          onSkipDailyTask={(id, title) => setSkippingTask({ id, title })}
        />

        {/* <CarePlanRecordSidebar
          resident={resident}
          plan={p}
        /> */}
      </div>

      {/* Dialog Modals */}
      <ResidentCarePlanDialogs
        residentId={residentId}
        activePlanId={activePlanId}
        planVersion={p.versionNumber || 1}
        goals={goals.map((g) => ({ id: g.id, title: g.title }))}
        plan={plan}
        isGoalDialogOpen={isGoalDialogOpen}
        onCloseGoalDialog={() => setIsGoalDialogOpen(false)}
        onSubmitGoal={(data) => {
          const mappedGoal = {
            title: data.title,
            targetDescription: data.targetDescription,
            category: (data.category || "Mobility") as GoalCategory,
            reviewFrequency: (data.reviewFrequency || "Weekly") as GoalReviewFrequency,
            progressPercent: data.progressPercent,
            status: (data.status || "Active") as GoalStatus,
            retirementReason: data.retirementReason || undefined,
          };
          if (editingGoal?.id) updateGoalMutation.mutate(mappedGoal);
          else createGoalMutation.mutate(mappedGoal);
          setIsGoalDialogOpen(false);
        }}
        editingGoal={editingGoal}
        isGoalLoading={createGoalMutation.isPending || updateGoalMutation.isPending}
        isTaskDialogOpen={isTaskDialogOpen}
        onCloseTaskDialog={() => setIsTaskDialogOpen(false)}
        onSubmitTask={(data) => {
          const mappedTask = {
            residentId,
            carePlanId: activePlanId,
            title: data.title,
            description: data.description,
            instructions: data.instructions,
            precautions: data.precautions,
            category: data.category,
            frequency: (data.frequency || "Daily") as TaskFrequency,
            timeOfDay: data.timeOfDay,
            targetTime: data.targetTime || undefined,
            priority: (["Low", "Medium", "High", "Critical"].includes(data.priority) ? data.priority : "Medium") as "Low" | "Medium" | "High" | "Critical",
            assignedStaffId: data.assignedStaffId || undefined,
            goalId: data.goalId || undefined,
            requirePhotoOrNote: data.requirePhotoOrNote,
            escalateIfSkipped: data.escalateIfSkipped,
          };
          if (editingTask?.id) updateTaskMutation.mutate(mappedTask);
          else createTaskMutation.mutate(mappedTask);
          setIsTaskDialogOpen(false);
        }}
        editingTask={editingTask}
        isTaskLoading={createTaskMutation.isPending || updateTaskMutation.isPending}
        isApprovalModalOpen={isApprovalModalOpen}
        selectedApproval={selectedApproval}
        onCloseApproval={() => setIsApprovalModalOpen(false)}
        onDecideApproval={(decision, comments) => {
          decideApprovalMutation.mutate({ decision, comments });
          setIsApprovalModalOpen(false);
        }}
        isApprovalLoading={decideApprovalMutation.isPending}
        isDiffViewerOpen={isDiffViewerOpen}
        onCloseDiff={() => setIsDiffViewerOpen(false)}
        diffData={diffData as unknown as CarePlanDiffResponseDTO}
        isEditMasterOpen={isEditMasterOpen}
        setIsEditMasterOpen={setIsEditMasterOpen}
        skippingTask={skippingTask}
        onCloseSkip={() => setSkippingTask(null)}
        onSubmitSkip={(reason: string) => {
          if (skippingTask) {
            updateDailyTaskMutation.mutate({
              taskId: skippingTask.id,
              data: { status: "Skipped", skipReason: reason },
            });
            setSkippingTask(null);
          }
        }}
      />
    </div>
  );
}
