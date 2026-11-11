"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
} from "@repo/ui/components/ui";
import { Target, CheckCircle2, Plus } from "lucide-react";
import { format } from "date-fns";

interface GoalItem {
  id: string;
  title: string;
  targetDescription: string;
  category: string;
  reviewFrequency?: string;
  progressPercent: number;
  status: string;
  nextReviewDate?: string | Date | null;
  tasks?: Array<Record<string, unknown>>;
}

interface CarePlanGoalsCardProps {
  goals: GoalItem[];
  isEditable?: boolean;
  onAddGoal?: () => void;
}

export function CarePlanGoalsCard({
  goals = [],
  isEditable,
  onAddGoal,
}: CarePlanGoalsCardProps) {
  const formatDate = (d: unknown) => {
    if (!d) return "Not Set";
    const date = new Date(d as string);
    return isNaN(date.getTime()) ? "Not Set" : format(date, "MMM d, yyyy");
  };

  return (
    <Card variant="surface" border="secondary" className="p-5 sm:p-6 space-y-4 rounded-2xl bg-white shadow-xs font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-secondary/30 pb-3">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Target className="size-4" />
          </div>
          <div>
            <h3 className="text-md font-bold text-text-primary  tracking-wider">
              Clinical Goals & Interventions ({goals.length})
            </h3>
            <p className="text-md text-text-description">
              Target outcomes, review cadence, and achievement progress
            </p>
          </div>
        </div>

        {isEditable && onAddGoal && (
          <Button variant="outline" size="sm" onClick={onAddGoal} className="gap-1 rounded-xl cursor-pointer">
            <Plus className="size-3.5" /> Add Goal
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {goals.length === 0 ? (
          <div className="py-8 text-center text-md text-text-description">
            No goals recorded in this care plan yet.
          </div>
        ) : (
          goals.map((goal) => {
            const isAchieved = goal.status === "Achieved" || goal.status === "achieved";
            const isRetired = goal.status === "Retired" || goal.status === "retired";

            return (
              <div
                key={goal.id}
                className="p-4 rounded-xl border border-border-secondary/40 bg-slate-50/40 hover:bg-slate-50 transition-colors space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-md font-bold text-text-primary">{goal.title}</span>
                    <Badge variant="secondary" state="inactive" className="px-2.5 py-0.5 shadow-none">
                      {goal.category}
                    </Badge>
                    <Badge
                      variant="secondary"
                      state={isAchieved ? "success" : isRetired ? "inactive" : "info"}
                      className="px-2.5 py-0.5 shadow-none"
                    >
                      {goal.status}
                    </Badge>
                  </div>

                  <div className="text-sm text-text-description flex items-center gap-3">
                    <span>Review: {goal.reviewFrequency || "Weekly"}</span>
                    <span>Next: {formatDate(goal.nextReviewDate)}</span>
                  </div>
                </div>

                <p className="text-md text-text-body">{goal.targetDescription}</p>

                {/* Progress Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-sm font-medium text-text-description">
                    <span>Progress</span>
                    <span>{goal.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${goal.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
