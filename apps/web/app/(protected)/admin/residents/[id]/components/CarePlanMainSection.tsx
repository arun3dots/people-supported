"use client";

import React, { useState } from "react";
import { Badge, Button, Card, Tabs, TabsContent, Text } from "@repo/ui/components/ui";
import { Plus } from "lucide-react";
import { CarePlanGoalList, GoalTaskItem } from "../../../../../shared/components/care-plan/CarePlanGoalList";
import { GoalFormData } from "../../../../../shared/components/care-plan/CarePlanGoalDialog";
import { CarePlanDailyExecutionsTab } from "../../../../../shared/components/care-plan/CarePlanDailyExecutionsTab";
import { CarePlanTaskRoutineCard } from "../../../../../shared/components/care-plan/CarePlanTaskRoutineCard";
import { CarePlanNarrativeSections } from "./CarePlanNarrativeSections";
import { CarePlanHistoryView, CarePlanVersionItem } from "../../../../../shared/components/care-plan/CarePlanHistoryView";

interface CarePlanMainSectionProps {
  activeSection: string;
  resident: any;
  plan: any;
  goals: any[];
  tasks: any[];
  unassignedTasks: any[];
  dailyTasks: any[];
  isEditable: boolean;
  versions?: CarePlanVersionItem[];
  onSelectVersion?: (id: string) => void;
  onAddGoal: () => void;
  onEditGoal: (goal: any) => void;
  onDeleteGoal: (id: string) => void;
  onAddTaskToGoal: (goalId?: string | null) => void;
  onEditTask: (task: any) => void;
  onDeleteTask: (taskId: string) => void;
  onCompleteDailyTask: (id: string) => void;
  onSkipDailyTask: (id: string, title: string) => void;
}

export function CarePlanMainSection({
  activeSection,
  resident,
  plan,
  goals,
  tasks,
  unassignedTasks,
  dailyTasks,
  isEditable,
  versions = [],
  onSelectVersion,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  onAddTaskToGoal,
  onEditTask,
  onDeleteTask,
  onCompleteDailyTask,
  onSkipDailyTask,
}: CarePlanMainSectionProps) {
  const [participationOption, setParticipationOption] = useState<string>("fully");

  const sectionMeta: Record<string, { title: string; desc: string }> = {
    history: { title: "Personal history", desc: "Who the resident is: life story, relationships, identity and what matters to them." },
    preferences: { title: "Preferences", desc: "How the resident wants to receive care and live day to day." },
    needs: { title: "Needs", desc: "Assessed care and support needs across daily living, nutrition, and clinical wellbeing." },
    goals: { title: "Goals", desc: "Resident-centred outcomes, agreed actions and who is responsible." },
    tasks: { title: "Tasks & Routines", desc: "All scheduled routine care tasks, nursing interventions, and assigned care teams for this resident." },
    risk: { title: "Risk summary", desc: "Identified clinical and environmental risks and active mitigation plans." },
    consent: { title: "Involvement & consent", desc: "Mental capacity, consent records, and resident/representative involvement in planning." },
    version_history: { title: "Care Plan Version History", desc: "Full audit trail of all revisions, renewal reasons, and version comparisons for this resident." },
  };

  const defaultMeta = { title: "Goals", desc: "Resident-centred outcomes, agreed actions and who is responsible." };
  const currentMeta = sectionMeta[activeSection] ?? defaultMeta;

  return (
    <Card
      variant="surface"
      className="flex-1 min-w-0 p-5 sm:p-6 gap-5 font-sans"
    >
      {/* Section Header */}
      <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Text as="h2" size="md" weight="bold" className="text-slate-900 tracking-tight">
            {currentMeta.title}
          </Text>
          <Text size="md" variant="muted" className="mt-0.5">
            {currentMeta.desc}
          </Text>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeSection === "goals" && isEditable && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddGoal}
            >
              <Plus className="size-3.5" /> Add a goal
            </Button>
          )}

          {activeSection === "tasks" && isEditable && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddTaskToGoal(null)}
            >
              <Plus className="size-3.5" /> New task
            </Button>
          )}
        </div>
      </div>

      {/* Narrative sections: Personal history, Preferences, Consent */}
      {(activeSection === "history" || activeSection === "preferences" || activeSection === "consent") && (
        <CarePlanNarrativeSections
          key={activeSection}
          activeSection={activeSection}
          resident={resident}
          isEditable={false}
          participationOption={participationOption}
          setParticipationOption={setParticipationOption}
        />
      )}

      {/* Needs section */}
      {activeSection === "needs" && (
        <div className="space-y-4">

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <Text size="md" weight="bold" className="text-slate-900">
                {resident?.careProfile?.primaryCareNeed || "Assisted Daily Living & Support"}
              </Text>
              <Badge variant="secondary" state="success" className="text-md font-semibold px-2 py-0.5 shadow-none">
                Assessed
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-md">
              <div className="flex items-center gap-1.5">
                <Text size="md" variant="muted">Care domain:</Text>
                <Text size="md" weight="medium" className="text-slate-800">
                  {resident?.careProfile?.careCategory || "Personal Care & Clinical Support"}
                </Text>
              </div>
              <div className="flex items-center gap-1.5">
                <Text size="md" variant="muted">Assessed need:</Text>
                <Text size="md" className="text-slate-800">
                  {resident?.careProfile?.primaryDiagnosis || "Routine daily living supervision"}
                </Text>
              </div>
              <div className="flex items-center gap-1.5">
                <Text size="md" variant="muted">Support required:</Text>
                <Text size="md" className="text-slate-800">
                  {resident?.careProfile?.feedingAssistanceNeed || "Assistance and routine monitoring"}
                </Text>
              </div>
              <div className="flex items-center gap-1.5">
                <Text size="md" variant="muted">Linked risk flag:</Text>
                <Text size="md" weight="semibold" className="text-amber-900">
                  {resident?.careProfile?.chronicConditions?.[0] || "None"}
                </Text>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goals section */}
      {activeSection === "goals" && (
        <Tabs defaultValue="goals" className="space-y-4">

          <TabsContent value="goals">
            <CarePlanGoalList
              goals={goals}
              allTasks={tasks as GoalTaskItem[]}
              unassignedTasks={unassignedTasks as GoalTaskItem[]}
              isEditable={isEditable}
              onAddGoal={onAddGoal}
              onEditGoal={(goal) => onEditGoal(goal as unknown as GoalFormData)}
              onDeleteGoal={(id) => onDeleteGoal(id)}
              onAddTaskToGoal={(goalId) => onAddTaskToGoal(goalId)}
              onEditTask={(task) => onEditTask(task as unknown as GoalTaskItem)}
              onDeleteTask={(taskId) => onDeleteTask(taskId)}
            />
          </TabsContent>

          <TabsContent value="daily">
            <CarePlanDailyExecutionsTab
              dailyTasks={dailyTasks}
              onComplete={onCompleteDailyTask}
              onSkip={onSkipDailyTask}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Tasks & Routines section */}
      {activeSection === "tasks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <Text size="md" weight="bold" className="text-slate-800 uppercase tracking-wider">
              All Scheduled Care Tasks ({tasks.length})
            </Text>
          </div>

          {tasks.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
              <Text size="md" weight="semibold" className="text-slate-700">
                No care tasks created yet
              </Text>
              <Text size="md" variant="muted" className="max-w-md mx-auto">
                No scheduled routine tasks exist for this resident. Create routine interventions to assign care staff and generate daily shift executions.
              </Text>
              {isEditable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddTaskToGoal(null)}
                  className="rounded-xl h-8 px-3 text-md font-semibold gap-1.5 mt-2"
                >
                  <Plus className="size-3.5" /> Create Care Task
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {(tasks as GoalTaskItem[]).map((task) => (
                <CarePlanTaskRoutineCard
                  key={task.id}
                  task={task}
                  isEditable={isEditable}
                  onEditTask={(t) => onEditTask(t as unknown as GoalTaskItem)}
                  onDeleteTask={(id) => onDeleteTask(id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Risk Summary section */}
      {activeSection === "risk" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <Text size="md" weight="bold" className="text-slate-800 uppercase tracking-wider">
              Identified Clinical &amp; Environmental Risks
            </Text>
          </div>

          {resident?.riskAssessments?.length > 0 ? (
            <div className="space-y-3">
              {resident.riskAssessments.map((ra: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <Text size="md" weight="bold" className="text-amber-900">{ra.type || ra.title || "Clinical Risk"}</Text>
                    <Badge variant="secondary" state="warning" className="text-md font-semibold px-2 py-0.5 shadow-none">
                      {ra.overallRisk || ra.score || "Monitored"}
                    </Badge>
                  </div>
                  {ra.summary && (
                    <Text size="md" className="text-slate-700 leading-relaxed">
                      {ra.summary}
                    </Text>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <Text size="md" variant="muted">
                {resident?.careProfile?.chronicConditions?.length
                  ? `Chronic condition alerts monitored: ${resident.careProfile.chronicConditions.join(", ")}.`
                  : "No active risk assessments flagged."}
              </Text>
            </div>
          )}
        </div>
      )}

      {/* Version History section */}
      {activeSection === "version_history" && (
        <CarePlanHistoryView
          versions={versions}
          currentPlanId={plan?.id || ""}
          residentName={resident?.fullName}
          onSelectVersion={(id) => onSelectVersion?.(id)}
        />
      )}
    </Card>
  );
}
