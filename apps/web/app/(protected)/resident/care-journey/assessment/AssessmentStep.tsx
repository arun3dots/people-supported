"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button, Spinner, Text } from "@repo/ui/components/ui";
import {
  ASSESSMENT_TOOLS,
  formatToolValue,
  normaliseToolResult,
  type AssessmentAreaKey,
  type CareAreaKey,
} from "@repo/schema";
import {
  useCompleteAssessmentMutation,
  useCreateAssessmentMutation,
  useGetAssessmentQuery,
  useListCareTaskDefinitionsQuery,
  useListNeedCarePlansQuery,
  useSaveAssessmentMutation,
} from "../../../../../lib/queries/care-journey";
import { useGetRiskAssessmentsQuery } from "../../../../../lib/queries/risk";
import { PartCard } from "../../admit/pre-admission/shared/PartCard";
import { CarePlanModal } from "../care-plans/CarePlanModal";
import { RatingPill } from "../shared";
import { NeedsTable } from "./NeedsTable";
import { buildAreaRiskChips } from "./riskAreaMapping";
import { ToolCard, hasToolValue } from "./ToolCard";
import { useAssessmentDraft } from "./useAssessmentDraft";

interface AssessmentStepProps {
  residentId: string;
  onNext: () => void;
  /** Embedded in the resident record: no "complete" action, the draft saves itself. */
  embedded?: boolean;
}

export function AssessmentStep({
  residentId,
  onNext,
  embedded = false,
}: AssessmentStepProps) {
  const query = useGetAssessmentQuery(residentId);
  const riskQuery = useGetRiskAssessmentsQuery({ residentId }, { enabled: !!residentId, staleTime: 0 });
  const plansQuery = useListNeedCarePlansQuery(residentId);
  const tasksQuery = useListCareTaskDefinitionsQuery(residentId);
  const create = useCreateAssessmentMutation();
  const save = useSaveAssessmentMutation();
  const complete = useCompleteAssessmentMutation();
  const record = query.data ?? null;
  const draft = useAssessmentDraft(record);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [modalArea, setModalArea] = useState<AssessmentAreaKey | null>(null);

  useEffect(() => {
    if (!draft.dirty) return;
    const savedRevision = draft.currentRevision();
    const timer = setTimeout(() => {
      save.mutate(
        { residentId, data: draft.payload },
        {
          onSuccess: () => {
            draft.markSaved(savedRevision);
            setSavedAt(new Date());
          },
        },
      );
    }, 1200);
    return () => clearTimeout(timer);
  }, [draft.dirty, draft.payload, residentId, save.mutate]);

  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spinner />
      </div>
    );
  }

  if (!record) {
    return (
      <PartCard
        title="ASSESSMENT AND RISK TOOLS"
        description="Starts from the pre-admission assessment so nothing is typed twice."
      >
        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={create.isPending}
          onClick={() => create.mutate(residentId)}
          className="rounded-xl font-semibold px-5 shadow-none"
        >
          {create.isPending ? "Starting…" : "Start assessment"}
        </Button>
      </PartCard>
    );
  }

  const saveDraft = async () => {
    const savedRevision = draft.currentRevision();
    await save.mutateAsync({ residentId, data: draft.payload });
    draft.markSaved(savedRevision);
  };

  const completeAndContinue = async () => {
    if (record.status === "Completed" && !draft.dirty) {
      onNext();
      return;
    }
    await saveDraft();
    await complete.mutateAsync(residentId);
    onNext();
  };

  const busy = save.isPending || complete.isPending;
  const scored = draft.tools.filter(hasToolValue).map(normaliseToolResult);
  const plans = plansQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];
  const riskAssessments = riskQuery.data ?? [];
  const chipsByArea = buildAreaRiskChips(riskAssessments, scored);
  const planCount =
    draft.needs.filter((n) => n.becomesCarePlan).length || plans.length;

  const activeNeed = modalArea
    ? (draft.needs.find((n) => n.areaKey === modalArea) ?? null)
    : null;
  const activePlan = modalArea
    ? (plans.find((p) => p.areaKey === modalArea) ?? null)
    : null;
  const activeRisk = modalArea
    ? (chipsByArea[modalArea as CareAreaKey]?.[0]?.planRisk ?? null)
    : null;

  return (
    <div className="space-y-6">
      {record.status === "Completed" && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-md">
          Version {record.versionNumber} is complete. Editing starts a new draft
          and refreshes the care plans when you complete it again.
        </div>
      )}

      {scored.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {scored.map((tool) => (
            <div
              key={tool.toolKey}
              className="bg-surface-card-grey rounded-2xl p-4 space-y-1"
            >
              <Text size="sm" weight="bold" className="text-slate-600">
                {ASSESSMENT_TOOLS.find((t) => t.key === tool.toolKey)?.name}
              </Text>
              <RatingPill rating={tool.rating ?? "none"}>
                {formatToolValue(tool)}
              </RatingPill>
            </div>
          ))}
        </div>
      )}

      {!embedded && (
        <PartCard
          title="RISK TOOLS"
          description="Scores are worked out for you and feed the areas of need below."
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {draft.tools.map((tool) => (
              <ToolCard key={tool.toolKey} tool={tool} onChange={draft.setTool} />
            ))}
          </div>
        </PartCard>
      )}

      <PartCard
        title="AREAS OF NEED"
        description="Link findings from risk assessments, set support levels, and add or edit each care plan."
      >
        <NeedsTable
          needs={draft.needs}
          tools={scored}
          riskAssessments={riskAssessments}
          plans={plans}
          onChange={draft.setNeed}
          onAddCustomNeed={draft.addCustomNeed}
          onRemoveCustomNeed={draft.removeCustomNeed}
          onOpenCarePlan={(areaKey) => {
            if (!draft.dirty) {
              setModalArea(areaKey);
              return;
            }
            const savedRevision = draft.currentRevision();
            save.mutate(
              { residentId, data: draft.payload },
              {
                onSuccess: () => {
                  draft.markSaved(savedRevision);
                  setSavedAt(new Date());
                  setModalArea(areaKey);
                },
              },
            );
          }}
        />
      </PartCard>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={busy || !draft.dirty}
            onClick={() => void saveDraft()}
            className="rounded-xl font-semibold px-5 shadow-none"
          >
            {save.isPending ? "Saving…" : "Save draft"}
          </Button>
          {savedAt && !save.isPending && (
            <span className="inline-flex items-center gap-1 text-sm text-slate-600">
              <Check className="size-3.5 text-emerald-700" />
              Saved {savedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        {!embedded && (
          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={busy || planCount === 0}
            onClick={() => void completeAndContinue()}
            className="rounded-xl font-semibold px-5 shadow-none"
          >
            {complete.isPending
              ? "Creating care plans…"
              : `Complete and create ${planCount} care plan${planCount === 1 ? "" : "s"}`}
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>

      <CarePlanModal
        open={modalArea !== null}
        onOpenChange={(open) => {
          if (!open) setModalArea(null);
        }}
        residentId={residentId}
        areaKey={modalArea}
        need={activeNeed}
        linkedRisk={activeRisk}
        existingPlan={activePlan}
        tasks={
          modalArea ? tasks.filter((t) => t.areaKey === modalArea) : []
        }
        onPlanSaved={(areaKey, savedLevel) => {
          draft.setNeed(areaKey, {
            becomesCarePlan: true,
            ...(savedLevel ? { supportLevel: savedLevel } : {}),
          });
        }}
      />
    </div>
  );
}
