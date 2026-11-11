"use client";

import { Suspense } from "react";
import Link from "next/link";
import {
  Button,
  Text,
} from "@repo/ui/components/ui";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Target,
  Users,
  Send,
  AlertCircle,
} from "lucide-react";
import { CarePlanGoalList } from "../../../../shared/components/care-plan/CarePlanGoalList";
import { CarePlanGoalDialog } from "../../../../shared/components/care-plan/CarePlanGoalDialog";
import { CarePlanTaskDialog } from "../../../../shared/components/care-plan/CarePlanTaskDialog";
import { CarePlanWizardStepper } from "./components/CarePlanWizardStepper";
import { PlanDetailsStep } from "./components/PlanDetailsStep";
import { AssignTeamStep } from "./components/AssignTeamStep";
import { PlanReviewStep } from "./components/PlanReviewStep";
import { useCreateCarePlanWizard } from "./hooks/useCreateCarePlanWizard";

const STEPS = [
  { id: 1, label: "Plan Details", icon: FileText },
  { id: 2, label: "Goals & Interventions", icon: Target },
  { id: 3, label: "Assign Team", icon: Users },
  { id: 4, label: "Review & Submit", icon: Send },
];

function CreateCarePlanWizardContent() {
  const {
    currentStep,
    setCurrentStep,
    error,
    residentId,
    setResidentId,
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
    authorRole,
    setAuthorRole,
    managerApproverId,
    setManagerApproverId,
    clinicalApproverId,
    setClinicalApproverId,
    residentAgreed,
    setResidentAgreed,
    legalConsentBasis,
    setLegalConsentBasis,
    representativeName,
    setRepresentativeName,
    goals,
    tasks,
    displayGoals,
    residents,
    staffList,
    createMutation,
    isGoalDialogOpen,
    setIsGoalDialogOpen,
    editingGoal,
    setEditingGoal,
    isTaskDialogOpen,
    setIsTaskDialogOpen,
    editingTask,
    setEditingTask,
    handleNext,
    handleSaveGoal,
    handleDeleteGoal,
    handleSaveTask,
    handleDeleteTask,
    handleSubmit,
  } = useCreateCarePlanWizard();

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Text as="h1" size="xl" weight="bold">
            Create Master Care Plan
          </Text>
          <Text size="sm" weight="regular" variant="muted">
            Set up goals, linked daily routines, and clinical assignments.
          </Text>
        </div>

        <Link href="/admin/care-plans">
          <Button
            variant="outline"
          >
            <ArrowLeft className="size-4" /> Back to Care Plans
          </Button>
        </Link>
      </div>

      {/* Stepper Progress */}
      <CarePlanWizardStepper steps={STEPS} currentStep={currentStep} />

      {error && (
        <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl">
          <AlertCircle className="size-4 text-rose-700 shrink-0" />
          <Text size="sm" weight="medium" variant="destructive">{error}</Text>
        </div>
      )}

      {/* Step Container */}
      <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 shadow-none border-none">
        {currentStep === 1 && (
          <PlanDetailsStep
            residentId={residentId}
            setResidentId={setResidentId}
            validFrom={validFrom}
            setValidFrom={setValidFrom}
            validTo={validTo}
            setValidTo={setValidTo}
            description={description}
            setDescription={setDescription}
            residents={residents}
          />
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <CarePlanGoalList
              goals={displayGoals}
              isEditable={true}
              onAddGoal={() => {
                setEditingGoal(null);
                setIsGoalDialogOpen(true);
              }}
              onEditGoal={(g) => {
                const matched = goals.find((item) => item.id === g.id);
                setEditingGoal(matched || null);
                setIsGoalDialogOpen(true);
              }}
              onDeleteGoal={handleDeleteGoal}
              onAddTaskToGoal={(goalId) => {
                const targetGoal = goals.find((g) => g.id === goalId);
                setEditingTask({
                  goalId: goalId || null,
                  title: "",
                  category: targetGoal?.category || "Personal Care",
                  frequency: "Daily",
                  timeOfDay: ["Morning"],
                  priority: "Medium",
                  instructions: "",
                  precautions: "",
                });
                setIsTaskDialogOpen(true);
              }}
              onEditTask={(t) => {
                const matched = tasks.find((item) => item.id === t.id);
                setEditingTask(matched || null);
                setIsTaskDialogOpen(true);
              }}
              onDeleteTask={handleDeleteTask}
            />
          </div>
        )}

        {currentStep === 3 && (
          <AssignTeamStep
            primaryDoctorId={primaryDoctorId}
            setPrimaryDoctorId={setPrimaryDoctorId}
            secondaryDoctorId={secondaryDoctorId}
            setSecondaryDoctorId={setSecondaryDoctorId}
            authorRole={authorRole}
            setAuthorRole={setAuthorRole}
            managerApproverId={managerApproverId}
            setManagerApproverId={setManagerApproverId}
            clinicalApproverId={clinicalApproverId}
            setClinicalApproverId={setClinicalApproverId}
            residentAgreed={residentAgreed}
            setResidentAgreed={setResidentAgreed}
            legalConsentBasis={legalConsentBasis}
            setLegalConsentBasis={setLegalConsentBasis}
            representativeName={representativeName}
            setRepresentativeName={setRepresentativeName}
            staffList={staffList}
          />
        )}

        {currentStep === 4 && (
          <PlanReviewStep
            residentName={residents.find((r) => r.id === residentId)?.fullName || residentId}
            validFrom={validFrom}
            validTo={validTo}
            goalsCount={goals.length}
            tasksCount={tasks.length}
            primaryDoctorName={staffList.find((s) => s.id === primaryDoctorId)?.fullName || primaryDoctorId}
          />
        )}

        {/* Footer Navigation */}
        <div className="flex justify-between items-center pt-6 border-t border-slate-200/80 mt-8">
          <Button
            variant="outline"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((p) => Math.max(p - 1, 1))}
          >
            Back
          </Button>

          {currentStep < 4 ? (
            <Button
              variant="primary"
              onClick={handleNext}

            >
              Next <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={createMutation.isPending}
            >
              <Send className="size-4" /> Create &amp; Submit
            </Button>
          )}
        </div>
      </div>

      {/* Modal Dialogs */}
      <CarePlanGoalDialog
        isOpen={isGoalDialogOpen}
        onClose={() => setIsGoalDialogOpen(false)}
        initialData={editingGoal}
        onSubmit={handleSaveGoal}
      />

      <CarePlanTaskDialog
        isOpen={isTaskDialogOpen}
        onClose={() => setIsTaskDialogOpen(false)}
        initialData={editingTask}
        goals={goals.map((g) => ({ id: g.id || g.title, title: g.title }))}
        staffList={staffList}
        onSubmit={handleSaveTask}
      />
    </div>
  );
}

export default function CreateCarePlanWizardPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400 text-md font-medium">Loading wizard...</div>}>
      <CreateCarePlanWizardContent />
    </Suspense>
  );
}