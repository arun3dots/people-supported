"use client";

import { JSX, use, useState } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Text,
} from "@repo/ui/components/ui";
import { CarePlanClinicalBanner } from "./components/banner";
import { CarePlanGoalList, GoalTaskItem } from "../../../../shared/components/care-plan/CarePlanGoalList";
import { GoalFormData } from "../../../../shared/components/care-plan/CarePlanGoalDialog";
import { TaskFormData } from "../../../../shared/components/care-plan/CarePlanTaskDialog";
import { CarePlanDailyExecutionsTab } from "../../../../shared/components/care-plan/CarePlanDailyExecutionsTab";
import { CarePlanDetailDialogs } from "./components/CarePlanDetailDialogs";
import { CarePlanReviewTimeline } from "./components/CarePlanReviewTimeline";
import { MentalCapacityDolsTab } from "./components/MentalCapacityDolsTab";
import { CarePlanPersonCentredDomainsTab } from "./components/CarePlanPersonCentredDomainsTab";
import { useCarePlanDetailPage } from "./hooks/useCarePlanDetailPage";
import {
  GoalCategory,
  GoalReviewFrequency,
  GoalStatus,
  TaskFrequency,
  CarePlanDiffResponseDTO,
} from "@repo/schema";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CarePlanDetailPage({ params }: PageProps): JSX.Element {
  const resolvedParams = use(params);
  const planId = resolvedParams.id;
  const [activeTab, setActiveTab] = useState<string>("goals");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isCalculatorsModalOpen, setIsCalculatorsModalOpen] = useState(false);
  const [isTransferPackOpen, setIsTransferPackOpen] = useState(false);

  const {
    router,
    plan,
    isPlanLoading,
    residentId,
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
  } = useCarePlanDetailPage(planId);

  if (isPlanLoading) {
    return (
      <div className="p-16 text-center bg-surface-card-grey rounded-2xl font-['Outfit',sans-serif]">
        <div className="animate-spin size-8 border-4 border-emerald-800 border-t-transparent rounded-full mx-auto mb-3" />
        <Text size="sm" weight="medium" variant="muted">
          Loading clinical care plan...
        </Text>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="p-8 text-center bg-surface-card-grey rounded-2xl font-['Outfit',sans-serif]">
        <Text size="sm" weight="medium" variant="muted">
          Care plan record not found.
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-['Outfit',sans-serif]">
      {/* Modern Unified Clinical Command Banner */}
      <CarePlanClinicalBanner
        plan={{
          id: p.id,
          versionNumber: p.versionNumber,
          status: p.status,
          validFrom: p.validFrom,
          validTo: p.validTo,
          nextReviewDate: p.nextReviewDate,
          description: p.description,
          primaryDoctorId: p.primaryDoctorId,
          authorRole: p.authorRole,
          departments: p.departments,
          doctorsInvolved: p.doctorsInvolved,
          resident: p.resident,
          parentVersion: p.parentVersion,
          approvals: p.approvals,
        }}
        primaryDoctorName={primaryDoctorName}
        dailyTasks={dailyTasks}
        activeDols={activeDols}
        assessments={assessments}
        isSubmitting={submitMutation.isPending}
        onSubmitForApproval={() => submitMutation.mutate()}
        onOpenApprovalModal={(approval) => {
          setSelectedApproval(approval);
          setIsApprovalModalOpen(true);
        }}
        onOpenReviewTab={() => setActiveTab("reviews")}
        onOpenDolsTab={() => setActiveTab("mca")}
        onOpenDailyTasksTab={() => setActiveTab("daily")}
        onOpenRenew={() => router.push(`/admin/care-plans/${planId}/renew`)}
        onOpenDiff={() => setIsDiffViewerOpen(true)}
        onOpenTransferPack={() => setIsTransferPackOpen(true)}
        onOpenCalculators={() => setIsCalculatorsModalOpen(true)}
        restrictiveTasksWithoutMca={restrictiveTasksWithoutMca}
      />

      {/* Primary Clinical Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="p-1 rounded-xl items-start justify-start bg-white border border-slate-200/80 shadow-none">
          <TabsTrigger value="domains" className="rounded-lg text-md font-semibold data-[state=active]:bg-emerald-800 data-[state=active]:text-white">
            Person-Centred Domains (9)
          </TabsTrigger>
          <TabsTrigger value="goals" className="rounded-lg text-md font-semibold data-[state=active]:bg-emerald-800 data-[state=active]:text-white">
            Goals &amp; Interventions ({p.goals?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="daily" className="rounded-lg text-md font-semibold data-[state=active]:bg-emerald-800 data-[state=active]:text-white">
            Shift Routines ({dailyTasks.length})
          </TabsTrigger>
          <TabsTrigger value="reviews" className="rounded-lg text-md font-semibold data-[state=active]:bg-emerald-800 data-[state=active]:text-white">
            Monthly Reviews ({(plan as { reviews?: unknown[] })?.reviews?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="mca" className="rounded-lg text-md font-semibold data-[state=active]:bg-emerald-800 data-[state=active]:text-white">
            Capacity &amp; DoLS ({assessments.length + dolsList.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Person-Centred Domains (PRSB & CQC) */}
        <TabsContent value="domains">
          <CarePlanPersonCentredDomainsTab
            carePlanId={planId}
            residentId={residentId}
            isEditable={isEditable}
          />
        </TabsContent>

        {/* Tab 2: Goals & Interventions */}
        <TabsContent value="goals">
          <CarePlanGoalList
            goals={p.goals || []}
            allTasks={(p.tasks as GoalTaskItem[]) || []}
            unassignedTasks={(p.tasks?.filter((t) => !t.goalId) as GoalTaskItem[]) || []}
            dailyTasks={dailyTasks}
            isEditable={isEditable}
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
          />
        </TabsContent>

        {/* Tab 3: Shift Routine Executions */}
        <TabsContent value="daily">
          <CarePlanDailyExecutionsTab
            dailyTasks={dailyTasks}
            onComplete={(id) =>
              updateDailyTaskMutation.mutate({
                taskId: id,
                data: { status: "Completed" },
              })
            }
            onSkip={(id, title) => setSkippingTask({ id, title })}
          />
        </TabsContent>

        {/* Tab 4: Monthly Reviews & Evaluations (CQC Reg 17) */}
        <TabsContent value="reviews">
          <CarePlanReviewTimeline carePlanId={planId} />
        </TabsContent>

        {/* Tab 5: Statutory Mental Capacity Act (MCA 2005) & DoLS */}
        <TabsContent value="mca">
          <MentalCapacityDolsTab
            carePlanId={planId}
            residentId={residentId}
            residentName={p.resident?.fullName || "Resident"}
          />
        </TabsContent>
      </Tabs>

      {/* Dialog Modals Extracted to Subcomponent for 350-line File Cap Compliance */}
      <CarePlanDetailDialogs
        planId={planId}
        residentId={residentId}
        residentName={p.resident?.fullName || "Resident"}
        planVersion={p.versionNumber || 1}
        goals={(p.goals || []).map((g) => ({ id: g.id || "", title: g.title }))}
        isGoalDialogOpen={isGoalDialogOpen}
        onCloseGoalDialog={() => setIsGoalDialogOpen(false)}
        onSubmitGoal={(data) => {
          const mappedGoal = {
            title: data.title,
            targetDescription: data.targetDescription,
            whyItMattersToResident: data.whyItMattersToResident || undefined,
            category: (data.category || "Mobility") as GoalCategory,
            reviewFrequency: (data.reviewFrequency || "Weekly") as GoalReviewFrequency,
            progressPercent: data.progressPercent,
            status: (data.status || "Active") as GoalStatus,
            retirementReason: data.retirementReason || undefined,
          };
          if (editingGoal?.id) {
            updateGoalMutation.mutate(mappedGoal);
          } else {
            createGoalMutation.mutate(mappedGoal);
          }
          setIsGoalDialogOpen(false);
        }}
        editingGoal={editingGoal}
        isGoalLoading={createGoalMutation.isPending || updateGoalMutation.isPending}
        isTaskDialogOpen={isTaskDialogOpen}
        onCloseTaskDialog={() => setIsTaskDialogOpen(false)}
        onSubmitTask={(data) => {
          const mappedTask = {
            residentId: residentId || undefined,
            carePlanId: planId,
            title: data.title,
            description: data.description,
            instructions: data.instructions,
            precautions: data.precautions,
            category: data.category,
            frequency: (data.frequency || "Daily") as TaskFrequency,
            timeOfDay: data.timeOfDay,
            targetTime: data.targetTime || undefined,
            priority: (data.priority === "Critical" ? "Critical" : data.priority === "High" ? "High" : data.priority === "Low" ? "Low" : "Medium") as "Low" | "Medium" | "High" | "Critical",
            assignedStaffId: data.assignedStaffId || undefined,
            goalId: data.goalId || undefined,
            requirePhotoOrNote: data.requirePhotoOrNote,
            escalateIfSkipped: data.escalateIfSkipped,
          };
          if (editingTask?.id) {
            updateTaskMutation.mutate(mappedTask);
          } else {
            createTaskMutation.mutate(mappedTask);
          }
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
        skippingTask={skippingTask}
        onCloseSkip={() => setSkippingTask(null)}
        onSubmitSkip={(reason) => {
          if (skippingTask) {
            updateDailyTaskMutation.mutate({
              taskId: skippingTask.id,
              data: {
                status: "Skipped",
                skipReason: reason,
              },
            });
            setSkippingTask(null);
          }
        }}
        isReviewModalOpen={isReviewModalOpen}
        onCloseReview={() => setIsReviewModalOpen(false)}
        isCalculatorsModalOpen={isCalculatorsModalOpen}
        onCloseCalculators={() => setIsCalculatorsModalOpen(false)}
        isTransferPackOpen={isTransferPackOpen}
        onCloseTransferPack={() => setIsTransferPackOpen(false)}
      />
    </div>
  );
}