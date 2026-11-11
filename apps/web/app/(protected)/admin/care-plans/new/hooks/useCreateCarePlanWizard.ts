"use client";

import { useState, useEffect } from "react";
import { format, addYears, isValid } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetResidentsQuery } from "../../../../../../lib/queries/residents";
import { useGetStaffQuery } from "../../../../../../lib/queries/staff";
import { useCreateCarePlanMutation } from "../../../../../../lib/queries/care-plan";
import { WizardGoal, WizardTask } from "../types";
import { GoalCategory, GoalReviewFrequency, GoalStatus, TaskFrequency } from "@repo/schema";
import { GoalItem } from "../../../../../shared/components/care-plan/CarePlanGoalList";

export function useCreateCarePlanWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialResidentId = searchParams.get("residentId") || "";

  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [residentId, setResidentId] = useState(initialResidentId);
  const [validFrom, setValidFrom] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [validTo, setValidTo] = useState(() => format(addYears(new Date(), 1), "yyyy-MM-dd"));
  const [description, setDescription] = useState("");
  const [authorRole, setAuthorRole] = useState("SeniorCarer");
  const [managerApproverId, setManagerApproverId] = useState("");
  const [clinicalApproverId, setClinicalApproverId] = useState("");
  const [primaryDoctorId, setPrimaryDoctorId] = useState("");
  const [secondaryDoctorId, setSecondaryDoctorId] = useState("");
  const [residentAgreed, setResidentAgreed] = useState(true);
  const [legalConsentBasis, setLegalConsentBasis] = useState("ResidentSelf");
  const [representativeName, setRepresentativeName] = useState("");
  const [departments] = useState<string[]>(["Nursing"]);

  // Goals & Tasks State
  const [goals, setGoals] = useState<WizardGoal[]>([
    {
      id: "goal-1",
      title: "Improve mobility and reduce fall risk",
      targetDescription: "Walk 10m unassisted with frame twice daily within 8 weeks.",
      category: "Mobility",
      reviewFrequency: "Weekly",
      progressPercent: 0,
      status: "Active",
    },
  ]);

  const [tasks, setTasks] = useState<WizardTask[]>([
    {
      id: "task-1",
      goalId: "goal-1",
      title: "Assisted transfer to wheelchair",
      instructions: "Assist resident using standing frame with 1 carer. Ensure brakes are locked.",
      precautions: "Resident feels dizzy if stood up quickly. Check stability before moving.",
      category: "Mobility",
      frequency: "Daily",
      timeOfDay: ["Morning"],
      targetTime: "08:30",
      priority: "Medium",
    },
  ]);

  // Dialog States
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<WizardGoal | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<WizardTask | null>(null);

  const { data: residentsData } = useGetResidentsQuery();
  const rawResidents = Array.isArray(residentsData)
    ? residentsData
    : ((residentsData as unknown as { residents?: Array<{ id: string; fullName: string; admissionDate?: string; isDraft?: boolean; status?: string }> })
        ?.residents || []);

  const residents = rawResidents.filter(
    (r: { isDraft?: boolean; status?: string }) => !r.isDraft && r.status === "Active"
  );

  useEffect(() => {
    if (residentId && Array.isArray(residents) && residents.length > 0) {
      const selected = (residents as Array<{ id: string; fullName: string; admissionDate?: string }>).find(
        (r) => r.id === residentId
      );
      if (selected?.admissionDate) {
        const parsedAdm = new Date(selected.admissionDate);
        if (isValid(parsedAdm)) {
          const formattedAdm = format(parsedAdm, "yyyy-MM-dd");
          setValidFrom(formattedAdm);
          setValidTo(format(addYears(parsedAdm, 1), "yyyy-MM-dd"));
          return;
        }
      }
      const today = new Date();
      setValidFrom(format(today, "yyyy-MM-dd"));
      setValidTo(format(addYears(today, 1), "yyyy-MM-dd"));
    }
  }, [residentId, residents])

  const { data: rawStaff = [] } = useGetStaffQuery();
  const staffList: Array<{ id: string; fullName: string }> = Array.isArray(rawStaff)
    ? (rawStaff as Array<{ id: string; fullName: string }>)
    : [];

  const createMutation = useCreateCarePlanMutation();

  const handleNext = () => {
    setError(null);
    if (currentStep === 1) {
      if (!residentId) return setError("Please select a resident.");
      if (!validFrom || !validTo) return setError("Please specify validity dates.");
      if (validTo && validFrom && new Date(validTo) <= new Date(validFrom)) {
        return setError("End date must be after start date.");
      }
    }
    if (currentStep === 2 && goals.length === 0) {
      return setError("At least one clinical goal is required.");
    }
    if (currentStep === 3) {
      if (!managerApproverId && !primaryDoctorId && !clinicalApproverId) {
        return setError("Please assign a Registered Manager or Approver for sign-off.");
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleSaveGoal = (data: WizardGoal) => {
    if (editingGoal?.id) {
      setGoals(goals.map((g) => (g.id === editingGoal.id ? { ...g, ...data } : g)));
    } else {
      const newId = `goal-${Date.now()}`;
      setGoals([...goals, { ...data, id: newId }]);
    }
    setIsGoalDialogOpen(false);
    setEditingGoal(null);
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(goals.filter((g) => g.id !== goalId));
    setTasks(tasks.filter((t) => t.goalId !== goalId));
  };

  const handleSaveTask = (data: WizardTask) => {
    if (editingTask?.id) {
      setTasks(tasks.map((t) => (t.id === editingTask.id ? { ...t, ...data } : t)));
    } else {
      const newId = `task-${Date.now()}`;
      setTasks([...tasks, { ...data, id: newId }]);
    }
    setIsTaskDialogOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter((t) => t.id !== taskId));
  };

  const handleSubmit = () => {
    createMutation.mutate(
      {
        residentId,
        validFrom: validFrom || new Date().toISOString(),
        validTo: validTo || new Date().toISOString(),
        description,
        authorRole: (authorRole as "SeniorCarer" | "RegisteredNurse" | "DeputyManager" | "RegisteredManager" | "Other") || "SeniorCarer",
        managerApproverId: managerApproverId || undefined,
        clinicalApproverId: clinicalApproverId === "none" ? undefined : clinicalApproverId || undefined,
        primaryDoctorId: primaryDoctorId === "none" ? undefined : primaryDoctorId || undefined,
        secondaryDoctorId: secondaryDoctorId === "none" ? undefined : secondaryDoctorId || undefined,
        residentAgreed,
        legalConsentBasis: (legalConsentBasis as "ResidentSelf" | "LPA_HealthAndWelfare" | "CourtOfProtection" | "BestInterests_Section4") || "ResidentSelf",
        representativeName: representativeName || undefined,
        departments,
        goals: goals.map(({ id: _id, ...g }) => ({
          title: g.title,
          targetDescription: g.targetDescription,
          category: (g.category as GoalCategory) || "Mobility",
          reviewFrequency: (g.reviewFrequency as GoalReviewFrequency) || "Weekly",
          progressPercent: g.progressPercent,
          status: (g.status === "Achieved" ? "Achieved" : g.status === "Retired" ? "Retired" : "Active") as GoalStatus,
          retirementReason: g.retirementReason || undefined,
        })),
        tasks: tasks.map(({ id: _id, goalId: _gId, ...t }) => ({
          title: t.title,
          description: t.description,
          instructions: t.instructions,
          precautions: t.precautions,
          category: t.category,
          frequency: (t.frequency as TaskFrequency) || "Daily",
          timeOfDay: t.timeOfDay,
          targetTime: t.targetTime || undefined,
          priority: t.priority,
          assignedStaffId: t.assignedStaffId || undefined,
          requirePhotoOrNote: t.requirePhotoOrNote,
          escalateIfSkipped: t.escalateIfSkipped,
        })),
      },
      {
        onSuccess: (res: unknown) => {
          router.push(`/admin/care-plans/${(res as { id?: string })?.id || ""}`);
        },
      }
    );
  };

  const displayGoals: GoalItem[] = goals.map((g) => {
    const goalTasks = tasks.filter((t) => t.goalId === g.id || (!t.goalId && t.category === g.category));
    return {
      id: g.id || g.title,
      title: g.title,
      targetDescription: g.targetDescription,
      category: g.category,
      reviewFrequency: g.reviewFrequency,
      progressPercent: g.progressPercent || 0,
      status: g.status,
      tasks: goalTasks.map((t) => ({
        id: t.id || t.title,
        title: t.title,
        category: t.category,
        frequency: t.frequency || "Daily",
        timeOfDay: t.timeOfDay,
        targetTime: t.targetTime,
        instructions: t.instructions,
        precautions: t.precautions,
        priority: t.priority,
        assignedStaff: t.assignedStaffId
          ? staffList.find((s) => s.id === t.assignedStaffId) || null
          : null,
      })),
    };
  });

  return {
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
  };
}
