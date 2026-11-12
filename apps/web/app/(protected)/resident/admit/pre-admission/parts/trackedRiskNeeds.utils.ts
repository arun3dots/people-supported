import {
  getCareArea,
  isUuid,
  type AssessmentAreaKey,
  type AssessmentNeedDTO,
  type AssessmentRating,
  type AssessmentRiskOption,
  type AssessmentToolKey,
  type NeedCarePlanRecordDTO,
  type NeedCarePlanRiskDTO,
} from "@repo/schema";
import type { RiskAssessmentResponse } from "../../../../../../lib/queries/risk";
import { matchRiskToArea } from "../../../care-journey/assessment/riskAreaMapping";

export interface TrackedNeedCardData {
  areaKey: AssessmentAreaKey;
  customAreaLabel?: string;
  label: string;
  source: string;
  toolKey: AssessmentToolKey | null;
  need: AssessmentNeedDTO | null;
  existingPlan: NeedCarePlanRecordDTO | null;
  selectedRisk: string;
  displayedFound: string;
  linkedRisk: NeedCarePlanRiskDTO | null;
  /** True for custom needs added by hand rather than from a tracked risk. */
  isManual: boolean;
}

function toAssessmentRating(level?: string | null): AssessmentRating {
  const norm = (level ?? "").toLowerCase();
  if (norm === "high" || norm === "extreme" || norm === "very high") return "high";
  if (norm === "medium" || norm === "med" || norm === "moderate") return "med";
  if (norm === "low") return "low";
  return "none";
}

export function inferRiskOptionFromAssessment(risk: {
  title?: string | null;
  tool?: string | null;
  category?: string | null;
}): AssessmentRiskOption | null {
  const combined =
    `${risk.title ?? ""} ${risk.tool ?? ""} ${risk.category ?? ""}`.toLowerCase();
  if (
    combined.includes("pressure") ||
    combined.includes("ulcer") ||
    combined.includes("waterlow") ||
    combined.includes("braden")
  ) {
    return "Pressure Ulcer Risk";
  }
  if (
    combined.includes("fall") ||
    combined.includes("morse") ||
    combined.includes("mobility") ||
    combined.includes("bed rail")
  ) {
    return "Fall Risk";
  }
  if (
    combined.includes("chok") ||
    combined.includes("dysphagia") ||
    combined.includes("swallow") ||
    combined.includes("iddsi")
  ) {
    return "Choking Risk";
  }
  if (combined.includes("dehydrat") || combined.includes("fluid")) {
    return "Dehydration Risk";
  }
  if (
    combined.includes("malnutrit") ||
    combined.includes("nutrition") ||
    combined.includes("must") ||
    combined.includes("weight")
  ) {
    return "Malnutrition Risk";
  }
  if (combined.includes("infect")) {
    return "Infection Risk";
  }
  return null;
}

function formatRiskFinding(ra: RiskAssessmentResponse): string {
  const desc = ra.hazardDescription?.trim();
  if (desc) return desc;
  const level = ra.residualLevel ?? ra.inherentLevel;
  const score = ra.residualScore ?? ra.inherentScore;
  const meta = [score !== null ? `Score ${score}` : null, level]
    .filter(Boolean)
    .join(" · ");
  const toolPart = ra.tool ? ` (${ra.tool})` : "";
  return meta ? `${ra.title}${toolPart}: ${meta}` : `${ra.title}${toolPart}`;
}

export function buildTrackedNeedCards(
  riskAssessments: RiskAssessmentResponse[],
  needs: AssessmentNeedDTO[],
  plans: NeedCarePlanRecordDTO[],
): TrackedNeedCardData[] {
  const activeAssessments = riskAssessments.filter(
    (ra) => ra.status !== "Archived",
  );
  const needByArea = new Map(needs.map((n) => [n.areaKey, n]));
  const planByArea = new Map(plans.map((p) => [p.areaKey, p]));

  const grouped = new Map<
    AssessmentAreaKey,
    {
      areaKey: AssessmentAreaKey;
      customAreaLabel?: string;
      label: string;
      source: string;
      toolKey: AssessmentToolKey | null;
      risks: RiskAssessmentResponse[];
    }
  >();

  for (const ra of activeAssessments) {
    const matched = matchRiskToArea(ra);
    let areaKey: AssessmentAreaKey | null = matched?.areaKey ?? null;
    let customAreaLabel: string | undefined;
    let label = matched
      ? (getCareArea(matched.areaKey)?.label ?? matched.areaKey)
      : ra.title;
    let source = matched
      ? (getCareArea(matched.areaKey)?.source ?? ra.title)
      : ra.title;
    const toolKey = matched?.toolKey ?? null;

    if (!areaKey) {
      if (!isUuid(ra.id)) continue;
      areaKey = `custom:${ra.id}`;
      customAreaLabel = ra.title.slice(0, 80);
      label = ra.title;
      source = ra.title;
    }

    const existing = grouped.get(areaKey);
    if (existing) {
      existing.risks.push(ra);
      if (!existing.toolKey && toolKey) existing.toolKey = toolKey;
    } else {
      grouped.set(areaKey, {
        areaKey,
        customAreaLabel,
        label,
        source,
        toolKey,
        risks: [ra],
      });
    }
  }

  const riskCards = Array.from(grouped.values()).map((entry) => {
    const need = needByArea.get(entry.areaKey) ?? null;
    const primaryRisk = entry.risks[0];
    const inferredRisk =
      entry.risks
        .map(inferRiskOptionFromAssessment)
        .find((opt): opt is AssessmentRiskOption => opt !== null) ?? "";
    const suggestedFound = Array.from(
      new Set(entry.risks.map(formatRiskFinding).filter(Boolean)),
    ).join("; ");

    const level = primaryRisk?.residualLevel ?? primaryRisk?.inherentLevel;
    const score = primaryRisk?.residualScore ?? primaryRisk?.inherentScore;
    const valuePart = [
      score !== null && score !== undefined ? `Score ${score}` : null,
      level,
    ]
      .filter(Boolean)
      .join(" · ");

    const linkedRisk: NeedCarePlanRiskDTO | null = primaryRisk
      ? {
          toolKey: entry.toolKey,
          name: primaryRisk.tool
            ? `${primaryRisk.title} (${primaryRisk.tool})`
            : primaryRisk.title,
          value: valuePart || "Tracked",
          rating: toAssessmentRating(level),
        }
      : null;

    return {
      areaKey: entry.areaKey,
      customAreaLabel: entry.customAreaLabel,
      label: entry.label,
      source: entry.source,
      toolKey: entry.toolKey,
      need,
      existingPlan: planByArea.get(entry.areaKey) ?? null,
      selectedRisk: need?.associatedRisk ?? inferredRisk,
      displayedFound: need?.found ?? suggestedFound,
      linkedRisk,
      isManual: false,
    };
  });

  // Custom support needs added by hand (not backed by a tracked risk assessment).
  const manualCards: TrackedNeedCardData[] = needs
    .filter((n) => n.areaKey.startsWith("custom:") && !grouped.has(n.areaKey))
    .map((n) => ({
      areaKey: n.areaKey,
      customAreaLabel: n.customAreaLabel,
      label: n.customAreaLabel ?? "Custom support need",
      source: n.customAreaLabel ?? "Custom support need",
      toolKey: null,
      need: n,
      existingPlan: planByArea.get(n.areaKey) ?? null,
      selectedRisk: n.associatedRisk ?? "",
      displayedFound: n.found ?? "",
      linkedRisk: null,
      isManual: true,
    }));

  return [...riskCards, ...manualCards];
}
