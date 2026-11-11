import {
  ASSESSMENT_TOOLS,
  CARE_AREA_TOOL,
  formatToolValue,
  type AssessmentRating,
  type AssessmentToolKey,
  type AssessmentToolResultDTO,
  type CareAreaKey,
  type NeedCarePlanRiskDTO,
} from "@repo/schema";
import type { RiskAssessmentResponse } from "../../../../../lib/queries/risk";

export interface StepRiskChip {
  id: string;
  areaKey: CareAreaKey;
  toolKey: AssessmentToolKey | null;
  /** Short badge text shown near "What the assessment found". */
  label: string;
  /** Text appended into "What the assessment found" when linked. */
  segment: string;
  rating: AssessmentRating;
  planRisk: NeedCarePlanRiskDTO;
}

const ratingFromLevel = (level?: string | null): AssessmentRating => {
  const norm = (level ?? "").toLowerCase();
  if (norm === "high" || norm === "extreme" || norm === "very high") return "high";
  if (norm === "medium" || norm === "med" || norm === "moderate") return "med";
  if (norm === "low") return "low";
  return "none";
};

/** Maps a Step 4 Risk Assessment to the Care Area(s) and tool key it informs. */
export function matchRiskToArea(risk: {
  title?: string | null;
  tool?: string | null;
  category?: string | null;
}): { areaKey: CareAreaKey; toolKey: AssessmentToolKey | null } | null {
  const combined = `${risk.title ?? ""} ${risk.tool ?? ""} ${risk.category ?? ""}`.toLowerCase();

  if (
    combined.includes("waterlow") ||
    combined.includes("pressure ulcer") ||
    combined.includes("skin") ||
    combined.includes("wound") ||
    combined.includes("braden") ||
    combined.includes("tissue")
  ) {
    return { areaKey: "skin", toolKey: "waterlow" };
  }
  if (
    combined.includes("fall") ||
    combined.includes("morse") ||
    combined.includes("bed rail") ||
    combined.includes("moving") ||
    combined.includes("mobility") ||
    combined.includes("handling") ||
    combined.includes("gait") ||
    combined.includes("zimmer") ||
    combined.includes("transfer")
  ) {
    return { areaKey: "mobility", toolKey: "falls" };
  }
  if (
    combined.includes("must") ||
    combined.includes("nutrition") ||
    combined.includes("hydration") ||
    combined.includes("choking") ||
    combined.includes("dysphagia") ||
    combined.includes("swallow") ||
    combined.includes("iddsi") ||
    combined.includes("diet") ||
    combined.includes("weight")
  ) {
    return { areaKey: "nutrition", toolKey: "must" };
  }
  if (
    combined.includes("continence") ||
    combined.includes("catheter") ||
    combined.includes("bowel") ||
    combined.includes("bladder") ||
    combined.includes("urinary") ||
    combined.includes("incontinence")
  ) {
    return { areaKey: "continence", toolKey: "continence" };
  }
  if (
    combined.includes("abbey") ||
    combined.includes("pain") ||
    combined.includes("medication") ||
    combined.includes("mar audit") ||
    combined.includes("medicines")
  ) {
    return { areaKey: "medicines", toolKey: "abbey" };
  }
  if (
    combined.includes("cmai") ||
    combined.includes("abc") ||
    combined.includes("behaviour") ||
    combined.includes("behavior") ||
    combined.includes("cognitive") ||
    combined.includes("dementia") ||
    combined.includes("distress") ||
    combined.includes("memory") ||
    combined.includes("confusion")
  ) {
    return { areaKey: "cognition", toolKey: "abc" };
  }
  if (
    combined.includes("infection") ||
    combined.includes("personal care") ||
    combined.includes("hygiene") ||
    combined.includes("washing") ||
    combined.includes("dressing")
  ) {
    return { areaKey: "personalCare", toolKey: null };
  }
  if (
    combined.includes("sleep") ||
    combined.includes("night") ||
    combined.includes("insomnia") ||
    combined.includes("rest")
  ) {
    return { areaKey: "sleep", toolKey: null };
  }
  if (
    combined.includes("positive risk") ||
    combined.includes("social") ||
    combined.includes("wellbeing") ||
    combined.includes("activity") ||
    combined.includes("community")
  ) {
    return { areaKey: "social", toolKey: null };
  }
  if (
    combined.includes("dols") ||
    combined.includes("capacity") ||
    combined.includes("mca") ||
    combined.includes("deprivation") ||
    combined.includes("consent") ||
    combined.includes("fire") ||
    combined.includes("peep")
  ) {
    return { areaKey: "capacity", toolKey: "dols" };
  }
  return null;
}

/**
 * Builds per-area risk chips from Step 4's Risk Assessments, falling back to
 * synced `AssessmentToolResultDTO` entries if no raw risk row matched an area.
 */
export function buildAreaRiskChips(
  riskAssessments: RiskAssessmentResponse[],
  tools: AssessmentToolResultDTO[] = [],
): Record<CareAreaKey, StepRiskChip[]> {
  const byArea: Record<CareAreaKey, StepRiskChip[]> = {
    mobility: [],
    skin: [],
    nutrition: [],
    continence: [],
    personalCare: [],
    medicines: [],
    cognition: [],
    sleep: [],
    social: [],
    capacity: [],
  };

  for (const ra of riskAssessments) {
    if (ra.status === "Archived") continue;
    const match = matchRiskToArea(ra);
    if (!match) continue;

    const level = ra.residualLevel ?? ra.inherentLevel;
    const score = ra.residualScore ?? ra.inherentScore;
    const rating = ratingFromLevel(level);
    const toolPart = ra.tool ? ` (${ra.tool})` : "";
    const valuePart = [score !== null ? `Score ${score}` : null, level]
      .filter(Boolean)
      .join(" · ");
    const label = `${ra.title}${toolPart} · ${valuePart}`;
    const segment = `${ra.title}${toolPart}: ${valuePart}`;

    byArea[match.areaKey].push({
      id: ra.id,
      areaKey: match.areaKey,
      toolKey: match.toolKey,
      label,
      segment,
      rating,
      planRisk: {
        toolKey: match.toolKey,
        name: ra.tool ? `${ra.title} (${ra.tool})` : ra.title,
        value: valuePart,
        rating,
      },
    });
  }

  // Fallback for any area whose tool result was saved directly on ResidentAssessment.
  (Object.entries(CARE_AREA_TOOL) as [CareAreaKey, AssessmentToolKey][]).forEach(
    ([areaKey, toolKey]) => {
      if (byArea[areaKey].length > 0) return;
      const tool = tools.find(
        (t) => t.toolKey === toolKey && (t.score != null || Boolean(t.label?.trim())),
      );
      if (!tool) return;
      const name = ASSESSMENT_TOOLS.find((t) => t.key === toolKey)?.name ?? toolKey;
      const value = formatToolValue(tool);
      const segment = `${name} ${value}`.trim();
      byArea[areaKey].push({
        id: `tool-${toolKey}`,
        areaKey,
        toolKey,
        label: segment,
        segment,
        rating: tool.rating ?? "none",
        planRisk: {
          toolKey,
          name,
          value,
          rating: tool.rating ?? "none",
        },
      });
    },
  );

  return byArea;
}
