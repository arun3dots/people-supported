import { CarePlanDiffResponseDTO, ItemDiffDTO } from '@repo/schema';

export interface PlanEntityWithGoalsAndTasks {
  id: string;
  versionNumber: number;
  validFrom: Date;
  validTo?: Date | null;
  description?: string | null;
  primaryDoctorId?: string | null;
  secondaryDoctorId?: string | null;
  departments: string[];
  goals: Array<{
    id: string;
    originGoalId?: string | null;
    title: string;
    category: string;
    targetDescription: string;
    reviewFrequency: string;
    progressPercent: number;
    status: string;
    retirementReason?: string | null;
  }>;
  tasks: Array<{
    id: string;
    originTaskId?: string | null;
    goalId?: string | null;
    title: string;
    category: string;
    frequency: string;
    timeOfDay: string[];
    priority: string;
    status: string;
  }>;
}

export function generateCarePlanDiff(
  sourcePlan: PlanEntityWithGoalsAndTasks,
  targetPlan: PlanEntityWithGoalsAndTasks,
): CarePlanDiffResponseDTO {
  // 1. Header Diffs
  const headerDiffs: Record<string, { before: unknown; after: unknown }> = {};
  if (
    sourcePlan.validFrom?.toISOString() !== targetPlan.validFrom?.toISOString()
  ) {
    headerDiffs.validFrom = {
      before: sourcePlan.validFrom,
      after: targetPlan.validFrom,
    };
  }
  if (sourcePlan.validTo?.toISOString() !== targetPlan.validTo?.toISOString()) {
    headerDiffs.validTo = {
      before: sourcePlan.validTo,
      after: targetPlan.validTo,
    };
  }
  if (sourcePlan.primaryDoctorId !== targetPlan.primaryDoctorId) {
    headerDiffs.primaryDoctorId = {
      before: sourcePlan.primaryDoctorId,
      after: targetPlan.primaryDoctorId,
    };
  }
  if (sourcePlan.secondaryDoctorId !== targetPlan.secondaryDoctorId) {
    headerDiffs.secondaryDoctorId = {
      before: sourcePlan.secondaryDoctorId,
      after: targetPlan.secondaryDoctorId,
    };
  }
  if (sourcePlan.description !== targetPlan.description) {
    headerDiffs.description = {
      before: sourcePlan.description,
      after: targetPlan.description,
    };
  }

  // 2. Goal Diffs
  let carriedOverGoals = 0;
  let changedGoals = 0;
  let newGoals = 0;
  let retiredGoals = 0;
  const goalDiffs: ItemDiffDTO[] = [];

  const sourceGoalMap = new Map(sourcePlan.goals.map((g) => [g.id, g]));
  const targetGoalOriginMap = new Map(
    targetPlan.goals
      .filter((g) => g.originGoalId)
      .map((g) => [g.originGoalId!, g]),
  );

  for (const targetGoal of targetPlan.goals) {
    if (!targetGoal.originGoalId) {
      newGoals++;
      goalDiffs.push({
        id: targetGoal.id,
        originId: null,
        title: targetGoal.title,
        category: targetGoal.category,
        diffTag: 'New',
        details: `New goal created: "${targetGoal.title}"`,
      });
    } else {
      const sourceGoal = sourceGoalMap.get(targetGoal.originGoalId);
      if (!sourceGoal) {
        newGoals++;
        goalDiffs.push({
          id: targetGoal.id,
          originId: targetGoal.originGoalId,
          title: targetGoal.title,
          category: targetGoal.category,
          diffTag: 'New',
        });
      } else {
        const fieldChanges: Record<
          string,
          { before: unknown; after: unknown }
        > = {};
        if (sourceGoal.title !== targetGoal.title) {
          fieldChanges.title = {
            before: sourceGoal.title,
            after: targetGoal.title,
          };
        }
        if (sourceGoal.targetDescription !== targetGoal.targetDescription) {
          fieldChanges.targetDescription = {
            before: sourceGoal.targetDescription,
            after: targetGoal.targetDescription,
          };
        }
        if (sourceGoal.category !== targetGoal.category) {
          fieldChanges.category = {
            before: sourceGoal.category,
            after: targetGoal.category,
          };
        }
        if (sourceGoal.reviewFrequency !== targetGoal.reviewFrequency) {
          fieldChanges.reviewFrequency = {
            before: sourceGoal.reviewFrequency,
            after: targetGoal.reviewFrequency,
          };
        }
        if (
          targetGoal.status === 'Retired' ||
          targetGoal.status === 'retired'
        ) {
          retiredGoals++;
          goalDiffs.push({
            id: targetGoal.id,
            originId: targetGoal.originGoalId,
            title: targetGoal.title,
            category: targetGoal.category,
            diffTag: 'Retired',
            details: targetGoal.retirementReason || 'Goal retired',
            fieldChanges,
          });
        } else if (Object.keys(fieldChanges).length > 0) {
          changedGoals++;
          goalDiffs.push({
            id: targetGoal.id,
            originId: targetGoal.originGoalId,
            title: targetGoal.title,
            category: targetGoal.category,
            diffTag: 'Changed',
            details: Object.keys(fieldChanges).join(', ') + ' updated',
            fieldChanges,
          });
        } else {
          carriedOverGoals++;
          goalDiffs.push({
            id: targetGoal.id,
            originId: targetGoal.originGoalId,
            title: targetGoal.title,
            category: targetGoal.category,
            diffTag: 'CarriedOver',
          });
        }
      }
    }
  }

  // Check source goals not in target
  for (const sourceGoal of sourcePlan.goals) {
    if (!targetGoalOriginMap.has(sourceGoal.id)) {
      retiredGoals++;
      goalDiffs.push({
        id: sourceGoal.id,
        originId: sourceGoal.id,
        title: sourceGoal.title,
        category: sourceGoal.category,
        diffTag: 'Retired',
        details: 'Excluded in new version',
      });
    }
  }

  // 3. Task Diffs
  let carriedOverTasks = 0;
  let changedTasks = 0;
  let newTasks = 0;
  let removedTasks = 0;
  const taskDiffs: ItemDiffDTO[] = [];

  const sourceTaskMap = new Map(sourcePlan.tasks.map((t) => [t.id, t]));
  const targetTaskOriginMap = new Map(
    targetPlan.tasks
      .filter((t) => t.originTaskId)
      .map((t) => [t.originTaskId!, t]),
  );

  for (const targetTask of targetPlan.tasks) {
    if (!targetTask.originTaskId) {
      newTasks++;
      taskDiffs.push({
        id: targetTask.id,
        originId: null,
        title: targetTask.title,
        category: targetTask.category,
        diffTag: 'New',
        details: `New task added: "${targetTask.title}"`,
      });
    } else {
      const sourceTask = sourceTaskMap.get(targetTask.originTaskId);
      if (!sourceTask) {
        newTasks++;
        taskDiffs.push({
          id: targetTask.id,
          originId: targetTask.originTaskId,
          title: targetTask.title,
          category: targetTask.category,
          diffTag: 'New',
        });
      } else {
        const fieldChanges: Record<
          string,
          { before: unknown; after: unknown }
        > = {};
        if (sourceTask.title !== targetTask.title) {
          fieldChanges.title = {
            before: sourceTask.title,
            after: targetTask.title,
          };
        }
        if (sourceTask.frequency !== targetTask.frequency) {
          fieldChanges.frequency = {
            before: sourceTask.frequency,
            after: targetTask.frequency,
          };
        }
        if (sourceTask.priority !== targetTask.priority) {
          fieldChanges.priority = {
            before: sourceTask.priority,
            after: targetTask.priority,
          };
        }
        if (Object.keys(fieldChanges).length > 0) {
          changedTasks++;
          taskDiffs.push({
            id: targetTask.id,
            originId: targetTask.originTaskId,
            title: targetTask.title,
            category: targetTask.category,
            diffTag: 'Changed',
            details: Object.keys(fieldChanges).join(', ') + ' updated',
            fieldChanges,
          });
        } else {
          carriedOverTasks++;
          taskDiffs.push({
            id: targetTask.id,
            originId: targetTask.originTaskId,
            title: targetTask.title,
            category: targetTask.category,
            diffTag: 'CarriedOver',
          });
        }
      }
    }
  }

  for (const sourceTask of sourcePlan.tasks) {
    if (!targetTaskOriginMap.has(sourceTask.id)) {
      removedTasks++;
      taskDiffs.push({
        id: sourceTask.id,
        originId: sourceTask.id,
        title: sourceTask.title,
        category: sourceTask.category,
        diffTag: 'Removed',
        details: 'Task removed in new version',
      });
    }
  }

  const carriedOverTotal = carriedOverGoals + carriedOverTasks;
  const changedTotal = changedGoals + changedTasks;
  const newTotal = newGoals + newTasks;
  const retiredTotal = retiredGoals;
  const removedTotal = removedTasks;

  const versionPill = `v${String(targetPlan.versionNumber).padStart(4, '0')}`;
  const humanSummary = `${versionPill} submitted for approval. Changes: ${changedTotal} updated, ${newTotal} added, ${retiredTotal + removedTotal} retired/removed, ${carriedOverTotal} carried forward unchanged.`;

  return {
    sourcePlanId: sourcePlan.id,
    sourceVersionNumber: sourcePlan.versionNumber,
    targetPlanId: targetPlan.id,
    targetVersionNumber: targetPlan.versionNumber,
    summary: {
      carriedOverCount: carriedOverTotal,
      changedCount: changedTotal,
      newCount: newTotal,
      retiredCount: retiredTotal,
      removedCount: removedTotal,
      humanSummary,
    },
    headerDiffs,
    goalDiffs,
    taskDiffs,
  };
}
