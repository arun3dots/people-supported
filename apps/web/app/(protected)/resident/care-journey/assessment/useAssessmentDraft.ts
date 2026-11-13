"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ASSESSMENT_TOOLS,
  ASSESSMENT_MAX_NEEDS,
  CARE_AREAS,
  normaliseToolResult,
  type AssessmentNeedDTO,
  type AssessmentNeedPatchDTO,
  type AssessmentRecordDTO,
  type AssessmentToolResultDTO,
  type CareAreaKey,
  type SaveAssessmentDTO,
} from "@repo/schema";
import { emptyTool, hasToolValue } from "./ToolCard";

const blankNeed = (areaKey: CareAreaKey): AssessmentNeedDTO => ({
  areaKey,
  supportLevel: null,
  found: null,
  source: null,
  toolKey: null,
  becomesCarePlan: false,
});

/** Local editable copy of the assessment, padded to every tool and area. */
export function useAssessmentDraft(record: AssessmentRecordDTO | null) {
  const [tools, setTools] = useState<AssessmentToolResultDTO[]>([]);
  const [needs, setNeeds] = useState<AssessmentNeedDTO[]>([]);
  const [dirty, setDirty] = useState(false);
  const hydratedFor = useRef<string | null>(null);
  const editRevision = useRef(0);

  // Only re-hydrate when a different version arrives, so a background refetch
  // caused by an autosave never overwrites what the assessor is typing.
  useEffect(() => {
    if (!record) return;
    const key = `${record.id}:${record.versionNumber}:${record.status}`;
    if (hydratedFor.current === key) return;
    hydratedFor.current = key;
    setTools(
      ASSESSMENT_TOOLS.map(
        (t) => record.tools.find((x) => x.toolKey === t.key) ?? emptyTool(t.key),
      ),
    );
    setNeeds(
      [
        ...CARE_AREAS.map(
          (a) =>
            record.needs.find((n) => n.areaKey === a.key) ?? blankNeed(a.key),
        ),
        ...record.needs.filter(
          (need) =>
            Boolean(need.customAreaLabel) &&
            !CARE_AREAS.some((area) => area.key === need.areaKey),
        ),
      ],
    );
    setDirty(false);
  }, [record]);

  const setTool = (next: AssessmentToolResultDTO) => {
    setTools((prev) => prev.map((t) => (t.toolKey === next.toolKey ? next : t)));
    editRevision.current += 1;
    setDirty(true);
  };

  const setNeed = (areaKey: string, patch: AssessmentNeedPatchDTO) => {
    setNeeds((prev) =>
      prev.map((need): AssessmentNeedDTO => {
        if (need.areaKey !== areaKey) return need;
        if (need.customAreaLabel !== undefined) {
          return {
            ...need,
            ...patch,
            areaKey: need.areaKey,
            customAreaLabel: need.customAreaLabel,
          };
        }
        return {
          ...need,
          ...patch,
          areaKey: need.areaKey,
        };
      }),
    );
    editRevision.current += 1;
    setDirty(true);
  };

  const upsertNeed = (
    areaKey: string,
    customAreaLabel: string | undefined,
    patch: AssessmentNeedPatchDTO,
  ) => {
    setNeeds((prev) => {
      if (prev.some((need) => need.areaKey === areaKey)) {
        return prev.map((need): AssessmentNeedDTO => {
          if (need.areaKey !== areaKey) return need;
          if (need.customAreaLabel !== undefined) {
            return {
              ...need,
              ...patch,
              areaKey: need.areaKey,
              customAreaLabel: need.customAreaLabel,
            };
          }
          return {
            ...need,
            ...patch,
            areaKey: need.areaKey,
          };
        });
      }
      if (areaKey.startsWith("custom:") && customAreaLabel?.trim()) {
        const nextCustom: AssessmentNeedDTO = {
          areaKey: areaKey as `custom:${string}`,
          customAreaLabel: customAreaLabel.trim(),
          supportLevel: patch.supportLevel ?? null,
          found: patch.found ?? null,
          source: patch.source ?? customAreaLabel.trim(),
          toolKey: patch.toolKey ?? null,
          associatedRisk: patch.associatedRisk ?? null,
          becomesCarePlan: patch.becomesCarePlan ?? false,
        };
        return [...prev, nextCustom];
      }
      return prev;
    });
    editRevision.current += 1;
    setDirty(true);
  };

  const addCustomNeed = (
    label: string,
    extra?: { found?: string | null; associatedRisk?: string | null },
  ) => {
    const customAreaLabel = label.trim().slice(0, 80);
    if (!customAreaLabel || needs.length >= ASSESSMENT_MAX_NEEDS) return;
    setNeeds((prev) => [
      ...prev,
      {
        areaKey: `custom:${crypto.randomUUID()}`,
        customAreaLabel,
        supportLevel: null,
        found: extra?.found?.trim() || null,
        associatedRisk: extra?.associatedRisk || null,
        source: null,
        toolKey: null,
        becomesCarePlan: false,
      },
    ]);
    editRevision.current += 1;
    setDirty(true);
  };

  const removeCustomNeed = (areaKey: string) => {
    setNeeds((prev) => prev.filter((need) => need.areaKey !== areaKey));
    editRevision.current += 1;
    setDirty(true);
  };

  const markSaved = (savedRevision: number) => {
    if (editRevision.current === savedRevision) setDirty(false);
  };

  const payload = useMemo<SaveAssessmentDTO>(
    () => ({
      tools: tools.filter(hasToolValue).map(normaliseToolResult),
      needs: needs.filter(
        (n) =>
          n.customAreaLabel ||
          n.supportLevel ||
          n.found ||
          n.associatedRisk ||
          n.becomesCarePlan,
      ),
      dols: record?.dols ?? null,
    }),
    [tools, needs, record?.dols],
  );

  return {
    tools,
    needs,
    dirty,
    setTool,
    setNeed,
    upsertNeed,
    addCustomNeed,
    removeCustomNeed,
    payload,
    currentRevision: () => editRevision.current,
    markSaved,
  };
}
