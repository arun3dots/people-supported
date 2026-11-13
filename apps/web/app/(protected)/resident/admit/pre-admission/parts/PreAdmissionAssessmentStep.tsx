"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { Check } from "lucide-react";
import {
  ASSESSMENT_MAX_NEEDS,
  normaliseToolResult,
  type AssessmentNeedDTO,
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
import { hasToolValue } from "../../../care-journey/assessment/ToolCard";
import { useAssessmentDraft } from "../../../care-journey/assessment/useAssessmentDraft";
import { CarePlanModal } from "../../../care-journey/care-plans/CarePlanModal";
import { PartCard } from "../shared/PartCard";
import { AddCustomNeedDialog } from "./AddCustomNeedDialog";
import {
  TrackedRiskAssessmentCards,
} from "./TrackedRiskAssessmentCards";
import {
  buildTrackedNeedCards,
  type TrackedNeedCardData,
} from "./trackedRiskNeeds.utils";

interface PreAdmissionAssessmentStepProps {
  residentId: string | null;
  onGoToStepOne: () => void;
  onGoToRiskStep?: () => void;
  flushRef?: MutableRefObject<(() => Promise<void>) | null>;
  /** Rendered inside an existing surface (resident record): no extra grey wrapper. */
  embedded?: boolean;
}

export function PreAdmissionAssessmentStep({
  residentId,
  onGoToStepOne,
  onGoToRiskStep,
  flushRef,
  embedded = false,
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
  const [modalCard, setModalCard] = useState<TrackedNeedCardData | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // Automatically start the ResidentAssessment draft on first visit once residentId exists.
  useEffect(() => {
    if (!residentId || query.isLoading || query.data || create.isPending) return;
    if (initAttempted.current === residentId) return;
    initAttempted.current = residentId;
    create.mutate(residentId);
  }, [residentId, query.isLoading, query.data, create]);

  // Debounced autosave while editing findings or associated risks.
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
  }, [residentId, record?.id, draft.dirty, draft.payload, save]);

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
        title="Care needs assessment"
        description="Review findings from the risk assessments and create support plans."
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

  if (query.isLoading || riskQuery.isLoading || (create.isPending && !record)) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spinner />
      </div>
    );
  }

  if (!record) {
    return (
      <PartCard
        title="Care needs assessment"
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

  const riskAssessments = riskQuery.data ?? [];
  const plans = plansQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];
  const cards = buildTrackedNeedCards(riskAssessments, draft.needs, plans);

  const handleOpenCarePlan = async (card: TrackedNeedCardData) => {
    const patch = {
      found: card.displayedFound || null,
      associatedRisk: card.selectedRisk || null,
      toolKey: card.toolKey,
      source: card.need?.source ?? card.source,
    };

    const needsSync =
      !card.need ||
      (card.need.found ?? "") !== card.displayedFound ||
      (card.need.associatedRisk ?? "") !== card.selectedRisk;

    if (needsSync) {
      draft.upsertNeed(card.areaKey, card.customAreaLabel, patch);
    }

    if (draft.dirty || needsSync) {
      const existing = draft.needs.find((n) => n.areaKey === card.areaKey);
      const patchedNeed: AssessmentNeedDTO = existing
        ? { ...existing, ...patch }
        : card.customAreaLabel && card.areaKey.startsWith("custom:")
          ? {
              areaKey: card.areaKey as `custom:${string}`,
              customAreaLabel: card.customAreaLabel,
              supportLevel: null,
              becomesCarePlan: false,
              ...patch,
            }
          : {
              areaKey: card.areaKey as Exclude<typeof card.areaKey, `custom:${string}`>,
              supportLevel: null,
              becomesCarePlan: false,
              ...patch,
            };

      const nextNeeds = draft.payload.needs.some((n) => n.areaKey === card.areaKey)
        ? draft.payload.needs.map((n) => (n.areaKey === card.areaKey ? patchedNeed : n))
        : [...draft.payload.needs, patchedNeed];

      const savedRevision = draft.currentRevision();
      await save.mutateAsync({
        residentId,
        data: {
          tools: draft.tools.filter(hasToolValue).map(normaliseToolResult),
          needs: nextNeeds,
          dols: record.dols ?? null,
        },
      });
      draft.markSaved(savedRevision);
      setSavedAt(new Date());
    }

    setModalCard(card);
  };

  const activeModalNeed: AssessmentNeedDTO | null = modalCard
    ? (draft.needs.find((n) => n.areaKey === modalCard.areaKey) ??
        modalCard.need ?? {
          ...(modalCard.customAreaLabel && modalCard.areaKey.startsWith("custom:")
            ? {
                areaKey: modalCard.areaKey as `custom:${string}`,
                customAreaLabel: modalCard.customAreaLabel,
                becomesCarePlan: false,
              }
            : {
                areaKey: modalCard.areaKey as Exclude<
                  typeof modalCard.areaKey,
                  `custom:${string}`
                >,
                becomesCarePlan: false,
              }),
          supportLevel: null,
          found: modalCard.displayedFound || null,
          source: modalCard.source,
          toolKey: modalCard.toolKey,
          associatedRisk: modalCard.selectedRisk || null,
        })
    : null;

  const activePlan = modalCard
    ? (plans.find((p) => p.areaKey === modalCard.areaKey) ?? null)
    : null;

  return (
    <div className="space-y-6 font-sans">
      <div
        className={
          embedded
            ? "space-y-4"
            : "bg-surface-card-grey rounded-2xl p-5 space-y-4 shadow-none border-none"
        }
      >
        <TrackedRiskAssessmentCards
          cards={cards}
          onChangeCard={(card, patch) =>
            draft.upsertNeed(card.areaKey, card.customAreaLabel, patch)
          }
          onOpenCarePlan={(card) => {
            void handleOpenCarePlan(card);
          }}
          onGoToRiskStep={onGoToRiskStep}
          onAddCustomNeed={() => setAddOpen(true)}
          onRemoveCard={(card) => draft.removeCustomNeed(card.areaKey)}
          addDisabled={draft.needs.length >= ASSESSMENT_MAX_NEEDS}
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
      </div>

      <AddCustomNeedDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={({ label, associatedRisk, found }) =>
          draft.addCustomNeed(label, { associatedRisk, found })
        }
      />

      <CarePlanModal
        open={modalCard !== null}
        onOpenChange={(open) => {
          if (!open) setModalCard(null);
        }}
        residentId={residentId}
        areaKey={modalCard?.areaKey ?? null}
        need={activeModalNeed}
        linkedRisk={modalCard?.linkedRisk ?? null}
        existingPlan={activePlan}
        tasks={
          modalCard ? tasks.filter((t) => t.areaKey === modalCard.areaKey) : []
        }
        onPlanSaved={(areaKey, savedLevel) => {
          draft.upsertNeed(areaKey, modalCard?.customAreaLabel, {
            becomesCarePlan: true,
            ...(savedLevel ? { supportLevel: savedLevel } : {}),
          });
        }}
      />
    </div>
  );
}
