import {
  type AssessmentNeedDTO,
  type AssessmentNeedPatchDTO,
} from "@repo/schema";
import type { RiskAssessmentResponse } from "../../../../../lib/queries/risk";
import { matchRiskToArea, type StepRiskChip } from "./riskAreaMapping";

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const isRiskChipLinked = (
  need: AssessmentNeedDTO,
  chip: StepRiskChip,
): boolean => {
  const current = (need.found ?? "").toLowerCase();
  return (
    current.includes(chip.segment.toLowerCase()) ||
    Boolean(chip.toolKey && need.toolKey === chip.toolKey && current.length > 0)
  );
};

export const toggleRiskChipFinding = (
  need: AssessmentNeedDTO,
  chip: StepRiskChip,
): AssessmentNeedPatchDTO => {
  const current = (need.found ?? "").trim();
  if (isRiskChipLinked(need, chip)) {
    const cleaned = current
      .replace(new RegExp(`[;,]?\\s*${escapeRegex(chip.segment)}`, "i"), "")
      .replace(/^[;,\s]+|[;,\s]+$/g, "")
      .trim();
    return {
      toolKey: need.toolKey === chip.toolKey ? null : need.toolKey,
      found: cleaned || null,
    };
  }

  return {
    toolKey: chip.toolKey ?? need.toolKey ?? null,
    found: current ? `${current}; ${chip.segment}` : chip.segment,
  };
};

export const selectRiskAssessmentFinding = (
  need: AssessmentNeedDTO,
  risk: RiskAssessmentResponse,
): AssessmentNeedPatchDTO | null => {
  const score = risk.residualScore ?? risk.inherentScore;
  const level = risk.residualLevel ?? risk.inherentLevel;
  const toolPart = risk.tool ? ` (${risk.tool})` : "";
  const scorePart = score != null ? `Score ${score} · ${level}` : (level || "");
  const hazardPart = risk.hazardDescription?.trim()
    ? ` — ${risk.hazardDescription.trim()}`
    : "";
  const findingSegment = `${risk.title}${toolPart}: ${scorePart}${hazardPart}`;
  const current = (need.found ?? "").trim();
  if (current && current.toLowerCase().includes(findingSegment.toLowerCase())) {
    return null;
  }

  return {
    found: current ? `${current}; ${findingSegment}` : findingSegment,
    toolKey: matchRiskToArea(risk)?.toolKey ?? need.toolKey ?? null,
  };
};

export const toggleSavedRiskAssessmentFinding = (
  need: AssessmentNeedDTO,
  risk: RiskAssessmentResponse,
): AssessmentNeedPatchDTO => {
  const score = risk.residualScore ?? risk.inherentScore;
  const level = risk.residualLevel ?? risk.inherentLevel;
  const toolPart = risk.tool ? ` (${risk.tool})` : "";
  const valuePart = [score !== null ? `Score ${score}` : null, level]
    .filter(Boolean)
    .join(" · ");
  const hazardPart = risk.hazardDescription?.trim()
    ? ` — ${risk.hazardDescription.trim()}`
    : "";
  const segment = `${risk.title}${toolPart}: ${valuePart}${hazardPart}`;
  const found = (need.found ?? "")
    .replace(new RegExp(`[;,]?\\s*${escapeRegex(segment)}`, "i"), "")
    .replace(/^[;,\s]+|[;,\s]+$/g, "")
    .trim();
  return { found: found || null };
};
