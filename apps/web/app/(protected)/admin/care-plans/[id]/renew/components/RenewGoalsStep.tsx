"use client";


import {
  Card,
  Button,
  Badge,
  Text,
} from "@repo/ui/components/ui";
import { Target, Plus, MinusCircle, Edit } from "lucide-react";
import { GoalFormData } from "../../../../../../shared/components/care-plan/CarePlanGoalDialog";

interface ClonedGoal extends GoalFormData {
  originGoalId?: string;
  diffTag?: "CarriedOver" | "Changed" | "New" | "Retired";
}

interface RenewGoalsStepProps {
  goals: ClonedGoal[];
  onOpenAddGoal: () => void;
  onOpenEditGoal: (goal: ClonedGoal) => void;
  onRetireGoal: (goalId: string) => void;
}

export function RenewGoalsStep({
  goals,
  onOpenAddGoal,
  onOpenEditGoal,
  onRetireGoal,
}: RenewGoalsStepProps) {
  const getDiffBadge = (tag?: string) => {
    switch (tag) {
      case "New":
        return <Badge variant="secondary" state="info" className="px-2.5 py-0.5 shadow-none">New</Badge>;
      case "Changed":
        return <Badge variant="secondary" state="warning" className="px-2.5 py-0.5 shadow-none">Changed</Badge>;
      case "Retired":
        return <Badge variant="secondary" state="inactive" className="px-2.5 py-0.5 shadow-none">Retired</Badge>;
      case "CarriedOver":
      default:
        return <Badge variant="secondary" state="success" className="px-2.5 py-0.5 shadow-none">Carried Over</Badge>;
    }
  };

  return (
    <Card className="p-6 space-y-4 font-['Outfit',sans-serif]">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Target className="size-5 text-emerald-800" />
            <Text as="h3" size="sm" weight="medium" className="text-slate-900">
              2. Review &amp; Update Goals
            </Text>
          </div>
          <Text size="sm" weight="regular" className="text-slate-500 mt-0.5">
            Existing goals have been carried over. Modify, mark achieved/retired, or add new targets.
          </Text>
        </div>
        <Button size="sm" onClick={onOpenAddGoal} className="gap-1.5 rounded-xl cursor-pointer">
          <Plus className="size-3.5" /> Add New Goal
        </Button>
      </div>

      <div className="space-y-3">
        {goals.map((goal, idx) => {
          const isRetired = goal.diffTag === "Retired" || goal.status === "Retired";

          return (
            <div
              key={goal.id || idx}
              className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-colors ${isRetired
                  ? "bg-slate-100/60 border-slate-200 opacity-60"
                  : "bg-white border-slate-200 hover:bg-slate-50/50"
                }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Text
                    size="sm"
                    weight="semibold"
                    className={isRetired ? "line-through text-slate-400" : "text-slate-900"}
                  >
                    {goal.title}
                  </Text>
                  <Badge variant="outline" className="shadow-none">
                    {goal.category}
                  </Badge>
                  {getDiffBadge(goal.diffTag)}
                  <Text size="sm" weight="regular" className="text-slate-500">
                    Progress: {goal.progressPercent}%
                  </Text>
                </div>
                <Text size="sm" weight="regular" className="text-slate-500">{goal.targetDescription}</Text>
              </div>

              <div className="flex items-center gap-1">
                {!isRetired && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => onOpenEditGoal(goal)} className="cursor-pointer">
                      <Edit className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => goal.id && onRetireGoal(goal.id)}
                      className="text-amber-700 hover:text-amber-900 cursor-pointer"
                    >
                      <MinusCircle className="size-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
