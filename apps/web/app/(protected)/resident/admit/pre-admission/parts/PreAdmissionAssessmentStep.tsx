"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { Check } from "lucide-react";
import {
  normaliseToolResult,
  type AssessmentAreaKey,
  type CareAreaKey,
} from "@repo/schema";
import {
  Alert,
  AlertDescription,
  Button,
  Spinner,
  Text,
} from "@repo/ui/components/ui";
import {
  useCreateAssessmentMutation,
  useGetAssessmentQuery,
  useListCareTaskDefinitionsQuery,
  useListNeedCarePlansQuery,
  useSaveAssessmentMutation,
} from "../../../../../../lib/queries/care-journey";
import { useGetRiskAssessmentsQuery } from "../../../../../../lib/queries/risk";
import { NeedsTable } from "../../../care-journey/assessment/NeedsTable";
import { buildAreaRiskChips } from "../../../care-journey/assessment/riskAreaMapping";
import { hasToolValue } from "../../../care-journey/assessment/ToolCard";
import { useAssessmentDraft } from "../../../care-journey/assessment/useAssessmentDraft";
import { CarePlanModal } from "../../../care-journey/care-plans/CarePlanModal";
import { PartCard } from "../shared/PartCard";

interface PreAdmissionAssessmentStepProps {
  residentId: string | null;
  onGoToStepOne: () => void;
  flushRef?: MutableRefObject<(() => Promise<void>) | null>;
}

export function PreAdmissionAssessmentStep({
  residentId,
  onGoToStepOne,
  flushRef,
}: PreAdmissionAssessmentStepProps) {
  const safeId = residentId ?? "";
  const query = useGetAssessmentQuery(safeId);
  const riskQuery = useGetRiskAssessmentsQuery(
    { residentId: safeId },
    { enabled: !!residentId, staleTime: 0 },
  );
  const plansQuery = useListNeedCarePlansQuery(safeId);
  const tasksQuery = useListCareTaskDefinitionsQuery(safeId);
  const create = useCreateAssessmentMutation();
  const save = useSaveAssessmentMutation();

  const record = query.data ?? null;
  const draft = useAssessmentDraft(record);
  const initAttempted = useRef<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [modalArea, setModalArea] = useState<AssessmentAreaKey | null>(null);

  // Automatically start the ResidentAssessment draft on first visit once residentId exists.
  useEffect(() => {
    if (!residentId || query.isLoading || query.data || create.isPending) return;
    if (initAttempted.current === residentId) return;
    initAttempted.current = residentId;
    create.mutate(residentId);
  }, [residentId, query.isLoading, query.data, create]);

  // Debounced autosave while editing findings or support levels.
  useEffect(() => {
    if (!residentId || !record?.id || !draft.dirty) return;
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
    }, 800);
    return () => clearTimeout(timer);
  }, [residentId, record?.id, draft.dirty, draft.payload, save.mutate]);

  // Expose flush callback so "Save and continue" persists immediately without waiting for debounce.
  useEffect(() => {
    if (!flushRef) return;
    flushRef.current = async () => {
      if (!residentId || !record || !draft.dirty) return;
      const savedRevision = draft.currentRevision();
      await save.mutateAsync({ residentId, data: draft.payload });
      draft.markSaved(savedRevision);
      setSavedAt(new Date());
    };
    return () => {
      flushRef.current = null;
    };
  }, [flushRef, residentId, record, draft.dirty, draft.payload, save]);

  if (!residentId) {
    return (
      <PartCard
        title="E · Care needs assessment"
        description="Review findings from the risk assessments, record support levels, and create care plans."
      >
        <Alert className="rounded-xl border-amber-200 bg-amber-50 p-6 text-center">
          <AlertDescription className="justify-items-center gap-3 text-amber-900">
            <Text size="md" weight="medium" className="text-amber-900">
              Please save Step 1 (Admission and personal details) first to generate a resident record before completing the needs assessment.
            </Text>
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={onGoToStepOne}
              className="rounded-xl font-semibold shadow-none cursor-pointer"
            >
              Go to Step 1
            </Button>
          </AlertDescription>
        </Alert>
      </PartCard>
    );
  }

  if (query.isLoading || (create.isPending && !record)) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spinner />
      </div>
    );
  }

  if (!record) {
    return (
      <PartCard
        title="E · Care needs assessment"
        description="Start the care needs assessment for this resident."
      >
        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={create.isPending}
          onClick={() => create.mutate(residentId)}
          className="rounded-xl font-semibold px-5 shadow-none cursor-pointer"
        >
          {create.isPending ? "Starting…" : "Start assessment"}
        </Button>
      </PartCard>
    );
  }

  const scored = draft.tools.filter(hasToolValue).map(normaliseToolResult);
  const riskAssessments = riskQuery.data ?? [];
  const plans = plansQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];
  const chipsByArea = buildAreaRiskChips(riskAssessments, scored);

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
    <div className="space-y-6 font-sans">
      <PartCard
        title="E · Care needs assessment"
        description="Link risk assessment findings from Step D to each area of need, choose the support level, and add or edit a care plan."
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

        {savedAt && !save.isPending && (
          <div className="flex justify-end pt-1">
            <Text as="span" size="md" className="inline-flex items-center gap-1.5 text-slate-600">
              <Check className="size-4 text-emerald-700" />
              Saved{" "}
              {savedAt.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </div>
        )}
      </PartCard>

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
