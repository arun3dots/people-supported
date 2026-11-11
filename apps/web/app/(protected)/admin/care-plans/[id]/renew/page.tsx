"use client";

import { use } from "react";
import Link from "next/link";
import { Button, Text } from "@repo/ui/components/ui";
import {
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Target,
  ListTodo,
  Send,
  AlertCircle,
  Check,
} from "lucide-react";
import { CarePlanGoalDialog } from "../../../../../shared/components/care-plan/CarePlanGoalDialog";
import { CarePlanTaskDialog } from "../../../../../shared/components/care-plan/CarePlanTaskDialog";
import { RenewReasonStep } from "./components/RenewReasonStep";
import { RenewGoalsStep } from "./components/RenewGoalsStep";
import { RenewTasksStep } from "./components/RenewTasksStep";
import { RenewDiffReviewStep } from "./components/RenewDiffReviewStep";
import { useRenewCarePlanWizard, ClonedGoal, ClonedTask } from "./hooks/useRenewCarePlanWizard";

const STEPS = [
  { id: 1, label: "Reason & Term", icon: RefreshCw },
  { id: 2, label: "Review Goals", icon: Target },
  { id: 3, label: "Daily Tasks", icon: ListTodo },
  { id: 4, label: "Review Diff", icon: Send },
];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RenewCarePlanPage({ params }: PageProps): React.JSX.Element {
  const resolvedParams = use(params);
  const parentPlanId = resolvedParams.id;

  const {
    router,
    currentStep,
    setCurrentStep,
    error,
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
  } = useRenewCarePlanWizard(parentPlanId);

  const p = (parentPlan || {}) as { resident?: { fullName?: string }; versionNumber?: number };
  const typedStaffList = staffList as Array<{ id: string; fullName: string; role?: { name: string } }>;
  const primaryDoc = typedStaffList.find((s) => s.id === primaryDoctorId)?.fullName || "Assigned Doctor";
  const secondaryDoc = typedStaffList.find((s) => s.id === secondaryDoctorId)?.fullName;

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/admin/care-plans/${parentPlanId}`}>
            <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-slate-600 rounded-xl">
              <ArrowLeft className="size-4" /> Cancel Renewal
            </Button>
          </Link>
          <span className="text-slate-300">/</span>
          <div>
            <Text as="h1" size="lg" weight="bold" className="text-slate-900">
              Renew Care Plan
            </Text>
            <Text size="sm" variant="muted">
              Creating next revision from v{p.versionNumber || 1} for {p.resident?.fullName || "Resident"}
            </Text>
          </div>
        </div>
      </div>

      {/* Stepper Bar */}
      <div className="grid grid-cols-4 gap-2 bg-surface-card-grey p-1.5 rounded-2xl">
        {STEPS.map((step) => {
          const isDone = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const Icon = step.icon;
          return (
            <button
              key={step.id}
              onClick={() => step.id < currentStep && setCurrentStep(step.id)}
              disabled={step.id > currentStep}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-md font-semibold transition-all ${isCurrent
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : isDone
                  ? "text-emerald-800 hover:bg-white/50 cursor-pointer"
                  : "text-slate-500 opacity-60 cursor-not-allowed"
                }`}
            >
              {isDone ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
              <span className="hidden sm:inline">{step.label}</span>
            </button>
          );
        })}
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-md font-medium">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step Contents */}
      {currentStep === 1 && (
        <RenewReasonStep
          renewalReason={renewalReason}
          setRenewalReason={setRenewalReason}
          validFrom={validFrom || ""}
          setValidFrom={setValidFrom}
          validTo={validTo || ""}
          setValidTo={setValidTo}
          description={description}
          setDescription={setDescription}
          primaryDoctorId={primaryDoctorId}
          setPrimaryDoctorId={setPrimaryDoctorId}
          secondaryDoctorId={secondaryDoctorId}
          setSecondaryDoctorId={setSecondaryDoctorId}
          staffList={typedStaffList}
        />
      )}

      {currentStep === 2 && (
        <RenewGoalsStep
          goals={goals}
          onOpenAddGoal={() => {
            setEditingGoal(null);
            setIsGoalDialogOpen(true);
          }}
          onOpenEditGoal={(goal: ClonedGoal) => {
            setEditingGoal(goal);
            setIsGoalDialogOpen(true);
          }}
          onRetireGoal={(goalId: string) => {
            setGoals((prev) =>
              prev.map((g) => (g.id === goalId ? { ...g, diffTag: "Retired", status: "Retired" } : g))
            );
          }}
        />
      )}

      {currentStep === 3 && (
        <RenewTasksStep
          tasks={tasks}
          onOpenAddTask={() => {
            setEditingTask(null);
            setIsTaskDialogOpen(true);
          }}
          onOpenEditTask={(task: ClonedTask) => {
            setEditingTask(task);
            setIsTaskDialogOpen(true);
          }}
          onRemoveTask={(taskId: string) => {
            setTasks((prev) =>
              prev.map((t) => (t.id === taskId ? { ...t, diffTag: "Removed", status: "Retired" } : t))
            );
          }}
        />
      )}

      {currentStep === 4 && (
        <RenewDiffReviewStep
          residentName={p.resident?.fullName || "Resident"}
          renewalReason={renewalReason}
          validFrom={validFrom || ""}
          validTo={validTo || ""}
          primaryDoctorName={primaryDoc}
          secondaryDoctorName={secondaryDoc}
          goals={goals}
          tasks={tasks}
        />
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200">
        <Button
          variant="outline"
          onClick={() => (currentStep === 1 ? router.back() : setCurrentStep((s) => s - 1))}
          className="rounded-xl h-10 px-5 font-semibold cursor-pointer"
        >
          {currentStep === 1 ? "Cancel" : "Back"}
        </Button>

        {currentStep < 4 ? (
          <Button
            variant="primary"
            onClick={() => setCurrentStep((s) => s + 1)}
            className="rounded-xl h-10 px-6 gap-2 font-semibold cursor-pointer"
          >
            Next Step <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={renewMutation.isPending}
            className="rounded-xl h-10 px-6 gap-2 font-semibold cursor-pointer"
          >
            {renewMutation.isPending ? "Creating Revision..." : "Publish Renewal"}
            <Send className="size-4" />
          </Button>
        )}
      </div>

      {/* Goal Edit Dialog */}
      {isGoalDialogOpen ? (
        <CarePlanGoalDialog
          isOpen={isGoalDialogOpen}
          onClose={() => setIsGoalDialogOpen(false)}
          onSubmit={handleSaveGoal}
          initialData={editingGoal || undefined}
        />
      ) : null}

      {/* Task Edit Dialog */}
      {isTaskDialogOpen ? (
        <CarePlanTaskDialog
          isOpen={isTaskDialogOpen}
          onClose={() => setIsTaskDialogOpen(false)}
          onSubmit={handleSaveTask}
          initialData={editingTask || undefined}
          goals={goals.map((g) => ({ id: g.id || g.title, title: g.title }))}
          staffList={staffList}
          residentId={(parentPlan as { residentId?: string })?.residentId}
        />
      ) : null}
    </div>
  );
}
