"use client";

import { Plus, X } from "lucide-react";
import {
  SUPPORT_LEVELS,
  type NeedCarePlanContentDTO,
  type SupportLevel,
} from "@repo/schema";
import { Button, Input, Label } from "@repo/ui/components/ui";
import {
  DateField,
  SelectField,
  TextAreaField,
} from "../../admit/pre-admission/shared/fields";
import { PartCard } from "../../admit/pre-admission/shared/PartCard";
import { SUPPORT_LEVEL_LABELS } from "../shared";

const LEVEL_OPTIONS = SUPPORT_LEVELS.map((l) => `${l} · ${SUPPORT_LEVEL_LABELS[l]}`);
const levelFromOption = (option: string): SupportLevel =>
  option.split(" ")[0] as SupportLevel;
const optionFromLevel = (level: SupportLevel | null): string =>
  level ? `${level} · ${SUPPORT_LEVEL_LABELS[level]}` : "";

interface ModalContentSectionsProps {
  level: SupportLevel | null;
  onLevelChange: (next: SupportLevel) => void;
  reviewDate: string;
  onReviewDateChange: (next: string) => void;
  content: NeedCarePlanContentDTO;
  readOnly?: boolean;
  onContentFieldChange: <K extends keyof NeedCarePlanContentDTO>(
    key: K,
    value: NeedCarePlanContentDTO[K],
  ) => void;
}

export function CarePlanContentSections({
  level,
  onLevelChange,
  reviewDate,
  onReviewDateChange,
  content,
  readOnly = false,
  onContentFieldChange,
}: ModalContentSectionsProps) {
  const steps = content.steps ?? [];
  const setSteps = (next: string[]) => onContentFieldChange("steps", next);

  return (
    <>
      <PartCard
        title="ABOUT THE PERSON"
        description="Written in their words where possible."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
          <SelectField
            label="Support level"
            value={optionFromLevel(level)}
            options={LEVEL_OPTIONS}
            disabled={readOnly}
            onChange={(v) => onLevelChange(levelFromOption(v))}
          />
          <DateField
            label="Review date"
            value={reviewDate}
            disabled={readOnly}
            onChange={onReviewDateChange}
          />
        </div>
        <TextAreaField
          label="My needs"
          value={content.needs}
          disabled={readOnly}
          onChange={(v) => onContentFieldChange("needs", v)}
        />
        <TextAreaField
          label="What matters to me"
          value={content.prefs}
          disabled={readOnly}
          onChange={(v) => onContentFieldChange("prefs", v)}
        />
        <TextAreaField
          label="My strengths"
          value={content.strengths}
          disabled={readOnly}
          onChange={(v) => onContentFieldChange("strengths", v)}
        />
      </PartCard>

      <PartCard
        title="HOW WE WILL SUPPORT"
        description="Each step can become a timed carer task."
      >
        <TextAreaField
          label="Outcome"
          value={content.outcome}
          disabled={readOnly}
          onChange={(v) => onContentFieldChange("outcome", v)}
        />
        <div className="space-y-2">
          <Label>How staff will support me</Label>
          {steps.map((stepText, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-md font-bold text-slate-600 w-6">
                {index + 1}.
              </span>
              <Input
                value={stepText}
                disabled={readOnly}
                placeholder="e.g. Offer steady arm and check Zimmer frame is within reach"
                onChange={(e) =>
                  setSteps(steps.map((s, i) => (i === index ? e.target.value : s)))
                }
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={`Remove step ${index + 1}`}
                disabled={readOnly}
                onClick={() => setSteps(steps.filter((_, i) => i !== index))}
                className="shadow-none cursor-pointer"
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            disabled={readOnly}
            onClick={() => setSteps([...steps, ""])}
            className="rounded-xl text-md font-semibold shadow-none cursor-pointer"
          >
            <Plus className="size-4" />
            Add step
          </Button>
        </div>
        <TextAreaField
          label="Monitoring"
          value={content.monitor}
          disabled={readOnly}
          onChange={(v) => onContentFieldChange("monitor", v)}
        />
        <TextAreaField
          label="When to escalate"
          value={content.escalation}
          disabled={readOnly}
          onChange={(v) => onContentFieldChange("escalation", v)}
        />
        <TextAreaField
          label="Capacity and consent"
          value={content.consent}
          disabled={readOnly}
          onChange={(v) => onContentFieldChange("consent", v)}
        />
        <TextAreaField
          label="Restrictions"
          value={content.restrictions}
          disabled={readOnly}
          onChange={(v) => onContentFieldChange("restrictions", v)}
        />
      </PartCard>
    </>
  );
}
