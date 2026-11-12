"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import {
  cleanAreaSource,
  SUPPORT_LEVELS,
  type CareTaskDefinitionDTO,
  type NeedCarePlanContentDTO,
  type NeedCarePlanRecordDTO,
  type SupportLevel,
} from "@repo/schema";
import { Button, Input, Label, Text } from "@repo/ui/components/ui";
import {
  useSaveNeedCarePlanMutation,
} from "../../../../../lib/queries/care-journey";
import {
  DateField,
  SelectField,
  TextAreaField,
} from "../../admit/pre-admission/shared/fields";
import { PartCard } from "../../admit/pre-admission/shared/PartCard";
import { RatingPill, SUPPORT_LEVEL_LABELS } from "../shared";
import { AgreementBox } from "./AgreementBox";
import { PlanTasksEditor } from "./PlanTasksEditor";

const LEVEL_OPTIONS = SUPPORT_LEVELS.map((l) => `${l} · ${SUPPORT_LEVEL_LABELS[l]}`);
const levelFromOption = (option: string): SupportLevel =>
  option.split(" ")[0] as SupportLevel;
const optionFromLevel = (level: SupportLevel | null): string =>
  level ? `${level} · ${SUPPORT_LEVEL_LABELS[level]}` : "";

interface PlanEditorProps {
  residentId: string;
  plan: NeedCarePlanRecordDTO;
  tasks: CareTaskDefinitionDTO[];
}

export function PlanEditor({ residentId, plan, tasks }: PlanEditorProps) {
  const save = useSaveNeedCarePlanMutation(residentId);
  const [content, setContent] = useState<NeedCarePlanContentDTO>(plan.content);
  const [level, setLevel] = useState<SupportLevel | null>(plan.supportLevel);
  const [reviewDate, setReviewDate] = useState<string>(plan.reviewDate ?? "");
  const [dirty, setDirty] = useState(false);
  const isAgreed = plan.status === "Agreed" || plan.agreedAt !== null;

  useEffect(() => {
    setContent(plan.content);
    setLevel(plan.supportLevel);
    setReviewDate(plan.reviewDate ?? "");
    setDirty(false);
    // Reset only when the saved record changes, not on every refetch.
  }, [plan.id, plan.updatedAt]);

  const set = <K extends keyof NeedCarePlanContentDTO>(
    key: K,
    value: NeedCarePlanContentDTO[K],
  ) => {
    setContent((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const steps = content.steps ?? [];
  const setSteps = (next: string[]) => set("steps", next);
  const readyToAgree =
    Boolean(content.outcome?.trim()) && steps.some((s) => s.trim());

  const submit = () => {
    if (isAgreed) return;
    save.mutate({
      planId: plan.id,
      data: {
        supportLevel: level,
        reviewDate: reviewDate || null,
        content: { ...content, steps: steps.filter((s) => s.trim()) },
      },
    });
  };

  // Drafts save themselves so switching plans never loses wording.
  const isDraft = plan.status === "Draft" && !isAgreed;
  useEffect(() => {
    if (!dirty || !isDraft) return;
    const timer = setTimeout(submit, 1500);
    return () => clearTimeout(timer);
  }, [content, level, reviewDate, dirty, isDraft]);

  const sourceLabel = cleanAreaSource(plan.areaKey, content.source);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Text as="h3" size="lg" weight="bold" className="text-slate-900">
            {plan.area}
          </Text>
          <p className="text-md text-slate-600">
            {sourceLabel ? `${sourceLabel} · ` : ""}version {plan.versionNumber}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {plan.risk && (
            <RatingPill rating={plan.risk.rating}>
              {plan.risk.name}: {plan.risk.value}
            </RatingPill>
          )}
          <RatingPill rating={plan.status === "Agreed" ? "low" : "med"}>
            {plan.status}
          </RatingPill>
        </div>
      </div>

      {content.found && (
        <div className="bg-surface-card-grey rounded-xl px-4 py-3">
          <p className="text-md font-bold text-slate-700">What the assessment found</p>
          <p className="text-md text-slate-800">{content.found}</p>
        </div>
      )}

      {isAgreed && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-md text-emerald-900">
          This agreed care plan is read-only. Changes require a formal amendment.
        </p>
      )}

      <PartCard title="ABOUT THE PERSON" description="Written in their words where possible.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
          <SelectField
            label="Support level"
            value={optionFromLevel(level)}
            options={LEVEL_OPTIONS}
            disabled={isAgreed}
            onChange={(v) => {
              setLevel(levelFromOption(v));
              setDirty(true);
            }}
          />
          <DateField
            label="Review date"
            value={reviewDate}
            disabled={isAgreed}
            onChange={(v) => {
              setReviewDate(v);
              setDirty(true);
            }}
          />
        </div>
        <TextAreaField label="My needs" value={content.needs} disabled={isAgreed} onChange={(v) => set("needs", v)} />
        <TextAreaField label="What matters to me" value={content.prefs} disabled={isAgreed} onChange={(v) => set("prefs", v)} />
        <TextAreaField label="My strengths" value={content.strengths} disabled={isAgreed} onChange={(v) => set("strengths", v)} />
      </PartCard>

      <PartCard
        title="HOW WE WILL SUPPORT"
        description="Describe support steps here; add scheduled tasks separately below."
      >
        <TextAreaField label="Outcome" value={content.outcome} disabled={isAgreed} onChange={(v) => set("outcome", v)} />
        <div className="space-y-2">
          <Label>How staff will support me</Label>
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-md font-bold text-slate-600 w-6">{index + 1}.</span>
              <Input
                value={step}
                disabled={isAgreed}
                onChange={(e) =>
                  setSteps(steps.map((s, i) => (i === index ? e.target.value : s)))
                }
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={`Remove step ${index + 1}`}
                disabled={isAgreed}
                onClick={() => setSteps(steps.filter((_, i) => i !== index))}
                className="shadow-none"
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            disabled={isAgreed}
            onClick={() => setSteps([...steps, ""])}
            className="rounded-xl shadow-none"
          >
            <Plus className="size-4" />
            Add step
          </Button>
        </div>
        <TextAreaField label="Monitoring" value={content.monitor} disabled={isAgreed} onChange={(v) => set("monitor", v)} />
        <TextAreaField label="When to escalate" value={content.escalation} disabled={isAgreed} onChange={(v) => set("escalation", v)} />
        <TextAreaField label="Capacity and consent" value={content.consent} disabled={isAgreed} onChange={(v) => set("consent", v)} />
        <TextAreaField label="Restrictions" value={content.restrictions} disabled={isAgreed} onChange={(v) => set("restrictions", v)} />
      </PartCard>

      <PartCard title="CREATES THESE TASKS">
        <PlanTasksEditor
          residentId={residentId}
          planId={plan.id}
          tasks={tasks}
          steps={steps.filter((s) => s.trim())}
          isAgreed={isAgreed}
        />
      </PartCard>

      {!isAgreed && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={!dirty || save.isPending}
            onClick={submit}
            className="rounded-xl font-semibold px-5 shadow-none"
          >
            {save.isPending ? "Saving…" : "Save care plan"}
          </Button>
        </div>
      )}

      <PartCard title="AGREED WITH THE PERSON">
        <AgreementBox
          residentId={residentId}
          plan={plan}
          disabled={dirty || !readyToAgree}
          disabledReason={
            dirty
              ? "Save your changes first"
              : readyToAgree
                ? undefined
                : "Add the outcome and at least one support step first"
          }
        />
      </PartCard>
    </div>
  );
}
