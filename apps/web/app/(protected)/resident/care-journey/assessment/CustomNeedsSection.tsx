"use client";

import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  ASSESSMENT_MAX_NEEDS,
  type AssessmentNeedDTO,
  type AssessmentNeedPatchDTO,
  type AssessmentAreaKey,
  type NeedCarePlanRecordDTO,
} from "@repo/schema";
import {
  Button,
  Input,
  TableCell,
  TableRow,
  Text,
} from "@repo/ui/components/ui";

interface CustomNeedFormProps {
  count: number;
  onAdd: (label: string) => void;
}

export function CustomNeedForm({ count, onAdd }: CustomNeedFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [label, setLabel] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedLabel = label.trim();
    if (!trimmedLabel) return;
    onAdd(trimmedLabel);
    setLabel("");
    setIsAdding(false);
  };

  return (
    <div className="space-y-2">
      {isAdding ? (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <Input
            autoFocus
            aria-label="Custom area of need name"
            maxLength={80}
            placeholder="Enter an area of need"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!label.trim() || count >= ASSESSMENT_MAX_NEEDS}
          >
            Add area
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setLabel("");
              setIsAdding(false);
            }}
          >
            Cancel
          </Button>
        </form>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={count >= ASSESSMENT_MAX_NEEDS}
          onClick={() => setIsAdding(true)}
          className="rounded-xl font-semibold shadow-none"
        >
          <Plus className="size-4" />
          Add custom area of need
        </Button>
      )}
      <Text size="sm" className="text-slate-600">
        Custom areas can be used to create care plans from the table below.
      </Text>
    </div>
  );
}

interface CustomNeedRowsProps {
  needs: AssessmentNeedDTO[];
  plans: NeedCarePlanRecordDTO[];
  onChange: (areaKey: string, patch: AssessmentNeedPatchDTO) => void;
  onRemove: (areaKey: string) => void;
  onOpenCarePlan: (areaKey: AssessmentAreaKey) => void;
}

export function CustomNeedRows({
  needs,
  plans,
  onChange,
  onRemove,
  onOpenCarePlan,
}: CustomNeedRowsProps) {
  const planByArea = new Map(plans.map((plan) => [plan.areaKey, plan]));
  return needs
    .filter((need) => need.customAreaLabel)
    .map((need) => {
      const existingPlan = planByArea.get(need.areaKey);
      return (
        <TableRow key={need.areaKey} className="align-top">
          <TableCell className="py-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Text size="md" weight="bold" className="text-slate-800">
                  {need.customAreaLabel}
                </Text>
                <Text size="sm" className="text-slate-600">
                  Custom area
                </Text>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove custom area ${need.customAreaLabel}`}
                onClick={() => onRemove(need.areaKey)}
                disabled={Boolean(existingPlan)}
                className="size-8 shrink-0 text-slate-500 hover:text-red-700"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </TableCell>
          <TableCell className="py-3.5">
            <Input
              aria-label={`${need.customAreaLabel} finding`}
              placeholder="Add assessment findings"
              value={need.found ?? ""}
              onChange={(event) =>
                onChange(need.areaKey, { found: event.target.value })
              }
            />
          </TableCell>
          <TableCell className="py-3.5">
            {existingPlan ? (
              <div className="space-y-1">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => onOpenCarePlan(need.areaKey)}
                  className="h-auto justify-start whitespace-normal p-0 text-left text-md font-semibold text-emerald-800 underline underline-offset-4 hover:text-emerald-950"
                >
                  {existingPlan.area}
                </Button>
                <Text size="sm" className="text-slate-600">
                  {existingPlan.status} · {existingPlan.taskCount} task
                  {existingPlan.taskCount === 1 ? "" : "s"}
                </Text>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenCarePlan(need.areaKey)}
                className="rounded-xl text-sm font-semibold shadow-none"
              >
                <Plus className="size-4" />
                Add care plan
              </Button>
            )}
          </TableCell>
        </TableRow>
      );
    });
}
