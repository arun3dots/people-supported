"use client";

import { useEffect, useState } from "react";
import {
  getCareArea,
  type AssessmentAreaKey,
  type AssessmentNeedDTO,
  type CareTaskDefinitionDTO,
  type CreateCareTaskDTO,
  type NeedCarePlanContentDTO,
  type NeedCarePlanRecordDTO,
  type NeedCarePlanRiskDTO,
  type SupportLevel,
} from "@repo/schema";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui";
import {
  useAgreeNeedCarePlanMutation,
  useCreateCareTaskMutation,
  useCreateNeedCarePlanMutation,
  useSaveNeedCarePlanMutation,
} from "../../../../../lib/queries/care-journey";
import { TextField } from "../../admit/pre-admission/shared/fields";
import { PartCard } from "../../admit/pre-admission/shared/PartCard";
import { RatingPill } from "../shared";
import { CarePlanContentSections } from "./CarePlanContentSections";
import { ModalAgreementSection, type SignerPerson } from "./ModalAgreementSection";
import { ModalTasksSection } from "./ModalTasksSection";

const defaultReviewDate = (): string => {
  const d = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

const emptyContent = (
  source: string | null,
  found: string | null,
): NeedCarePlanContentDTO => ({
  source,
  found,
  needs: null,
  prefs: null,
  strengths: null,
  outcome: null,
  steps: [],
  monitor: null,
  escalation: null,
  consent: null,
  restrictions: null,
});

export interface CarePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residentId: string;
  areaKey: AssessmentAreaKey | null;
  need: AssessmentNeedDTO | null;
  linkedRisk: NeedCarePlanRiskDTO | null;
  existingPlan: NeedCarePlanRecordDTO | null;
  tasks: CareTaskDefinitionDTO[];
  onPlanSaved?: (areaKey: AssessmentAreaKey, supportLevel: SupportLevel | null) => void;
}

export function CarePlanModal({
  open,
  onOpenChange,
  residentId,
  areaKey,
  need,
  linkedRisk,
  existingPlan,
  tasks,
  onPlanSaved,
}: CarePlanModalProps) {
  const createPlan = useCreateNeedCarePlanMutation(residentId);
  const savePlan = useSaveNeedCarePlanMutation(residentId);
  const createTask = useCreateCareTaskMutation(residentId);
  const agreePlan = useAgreeNeedCarePlanMutation(residentId);

  const areaMeta = areaKey ? getCareArea(areaKey) : undefined;
  const areaLabel =
    areaMeta?.label ?? need?.customAreaLabel ?? existingPlan?.area;
  const areaSource =
    areaMeta?.source ?? need?.source ?? existingPlan?.content.source ?? "Custom area";
  const isAgreed = existingPlan?.status === "Agreed" || existingPlan?.agreedAt != null;
  const [planName, setPlanName] = useState("");
  const [level, setLevel] = useState<SupportLevel | null>(null);
  const [reviewDate, setReviewDate] = useState("");
  const [content, setContent] = useState<NeedCarePlanContentDTO>(() =>
    emptyContent(null, null),
  );
  const [pendingTasks, setPendingTasks] = useState<CreateCareTaskDTO[]>([]);
  const [people, setPeople] = useState<SignerPerson[]>([{ name: "", role: "" }]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!open || !areaKey) return;
    const meta = getCareArea(areaKey);
    setPlanName(existingPlan?.area ?? meta?.label ?? need?.customAreaLabel ?? "");
    setLevel(existingPlan?.supportLevel ?? need?.supportLevel ?? null);
    setReviewDate(
      existingPlan?.reviewDate ? existingPlan.reviewDate.slice(0, 10) : defaultReviewDate(),
    );
    setContent(
      existingPlan?.content
        ? { ...existingPlan.content, found: need?.found ?? existingPlan.content.found }
        : emptyContent(
            meta?.source ?? need?.source ?? "Custom area",
            need?.found ?? null,
          ),
    );
    setPendingTasks([]);
    const savedPeople =
      existingPlan?.content.consultationPeople ??
      existingPlan?.agreement?.agreedBy ??
      [];
    setPeople(
      savedPeople.length > 0
        ? savedPeople.map(({ name, role }) => ({ name, role }))
        : [{ name: "", role: "" }],
    );
    setDirty(false);
  }, [open, areaKey, existingPlan?.id, existingPlan?.updatedAt]);

  if (!areaKey || !areaLabel) return null;

  const setField = <K extends keyof NeedCarePlanContentDTO>(
    key: K,
    value: NeedCarePlanContentDTO[K],
  ) => {
    setContent((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const cleanSteps = (content.steps ?? []).map((s) => s.trim()).filter(Boolean);
  const readyToAgree = Boolean(content.outcome?.trim()) && cleanSteps.length > 0;
  const consultationPeople = people
    .filter((person) => person.name.trim() || person.role.trim())
    .map((person) => ({
      name: person.name.trim(),
      role: person.role.trim(),
    }));
  const filledSigners = people.filter((p) => p.name.trim() && p.role.trim());
  const activeRisk = linkedRisk ?? existingPlan?.risk ?? null;
  const foundSummary = need?.found || content.found || null;

  const isSaving =
    createPlan.isPending ||
    savePlan.isPending ||
    createTask.isPending ||
    agreePlan.isPending;

  const handleSave = async () => {
    if (isAgreed) return;
    const trimmedName = planName.trim() || areaLabel;
    const nextContent: NeedCarePlanContentDTO = {
      ...content,
      source: content.source ?? areaSource,
      found: need?.found ?? content.found ?? null,
      steps: cleanSteps,
      consultationPeople,
    };

    try {
      const saved = existingPlan
        ? await savePlan.mutateAsync({
            planId: existingPlan.id,
            data: {
              area: trimmedName,
              supportLevel: level,
              reviewDate: reviewDate || null,
              risk: activeRisk,
              content: nextContent,
            },
          })
        : await createPlan.mutateAsync({
            areaKey,
            area: trimmedName,
            supportLevel: level,
            reviewDate: reviewDate || null,
            risk: activeRisk,
            content: nextContent,
          });

      for (const task of pendingTasks) {
        await createTask.mutateAsync({ planId: saved.id, data: task });
      }

      if (filledSigners.length > 0 && readyToAgree && saved.status === "Draft") {
        await agreePlan.mutateAsync({
          planId: saved.id,
          data: { agreedBy: filledSigners },
        });
      }

      onPlanSaved?.(areaKey, level);
      onOpenChange(false);
    } catch {
      // Mutation hooks display toast notifications on error
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="3xl"
        className="p-6 max-h-[90vh] overflow-y-auto space-y-5 font-sans"
      >
        <DialogHeader className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-3 pr-6">
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                {existingPlan ? "Edit care plan" : "Create care plan"}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-600 mt-0.5">
                {areaLabel} · {areaSource}
                {existingPlan ? ` · version ${existingPlan.versionNumber}` : ""}
              </DialogDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {activeRisk && (
                <RatingPill rating={activeRisk.rating}>
                  {activeRisk.name}: {activeRisk.value}
                </RatingPill>
              )}
              <RatingPill rating={existingPlan?.status === "Agreed" ? "low" : "med"}>
                {existingPlan?.status ?? "Draft"}
              </RatingPill>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {isAgreed && (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              This agreed care plan is read-only. Changes require a formal
              amendment.
            </p>
          )}
          <TextField
            label="Care plan name"
            required
            disabled={isAgreed}
            placeholder={`e.g. ${areaLabel}`}
            value={planName}
            onChange={(v) => {
              setPlanName(v);
              setDirty(true);
            }}
          />

          {foundSummary && (
            <div className="bg-surface-card-grey rounded-xl px-4 py-3 space-y-0.5">
              <p className="text-sm font-bold text-slate-700">
                What the assessment found
              </p>
              <p className="text-md text-slate-800">{foundSummary}</p>
            </div>
          )}

          <CarePlanContentSections
            level={level}
            onLevelChange={(next) => {
              setLevel(next);
              setDirty(true);
            }}
            reviewDate={reviewDate}
            onReviewDateChange={(next) => {
              setReviewDate(next);
              setDirty(true);
            }}
            content={content}
            readOnly={isAgreed}
            onContentFieldChange={setField}
          />

          <PartCard title="CREATES THESE TASKS">
            <ModalTasksSection
              residentId={residentId}
              planId={existingPlan?.id ?? null}
              tasks={tasks}
              pendingTasks={pendingTasks}
              onPendingTasksChange={setPendingTasks}
              isAgreed={isAgreed}
            />
          </PartCard>

          <PartCard title="AGREED WITH THE PERSON">
            <ModalAgreementSection
              residentId={residentId}
              existingPlan={existingPlan}
              dirty={dirty}
              readyToAgree={readyToAgree}
              people={people}
              onPeopleChange={(nextPeople) => {
                setPeople(nextPeople);
                setDirty(true);
              }}
            />
          </PartCard>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
            className="rounded-xl font-semibold px-5 shadow-none cursor-pointer"
          >
            Cancel
          </Button>
          {!isAgreed && (
          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={!planName.trim() || isSaving}
            onClick={() => void handleSave()}
            className="rounded-xl font-semibold px-5 shadow-none cursor-pointer"
          >
            {isSaving ? "Saving…" : "Save care plan"}
          </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
