import type { RiskCategory, ReviewFrequency, CreateRiskAssessmentDTO, RiskStatus } from "@repo/schema";
import type { RiskAssessmentResponse } from "../../../../lib/queries/risk";
import type { FurtherAction } from "./RiskFurtherActionsSection";

export const CATEGORIES: RiskCategory[] = [
  "Clinical",
  "Environmental",
  "Behavioral",
  "Building",
  "Individual",
];

export const FREQUENCIES: ReviewFrequency[] = [
  "Weekly",
  "Monthly",
  "Quarterly",
  "SixMonthly",
  "Annual",
  "AfterIncident",
];

export interface FormState {
  templateId: string | null;
  category: RiskCategory | "";
  title: string;
  hazardDescription: string;
  whoCouldBeHarmed: string;
  tool: string;
  likelihood: number;
  severity: number;
  reviewFrequency: ReviewFrequency | "";
  controlsText: string;
  furtherActions: FurtherAction[];
}

export const blankState: FormState = {
  templateId: null,
  category: "",
  title: "",
  hazardDescription: "",
  whoCouldBeHarmed: "",
  tool: "",
  likelihood: 0,
  severity: 0,
  reviewFrequency: "",
  controlsText: "",
  furtherActions: [],
};

export interface FormValidationErrors {
  category?: string;
  title?: string;
  hazardDescription?: string;
  inherent?: string;
}

export function validateRiskForm(state: FormState): FormValidationErrors {
  const errs: FormValidationErrors = {};
  if (!state.category) {
    errs.category = "Please select a risk category";
  }
  if (!state.title.trim() || state.title.trim().length < 2) {
    errs.title = "Title must contain at least 2 characters";
  }
  if (!state.hazardDescription.trim() || state.hazardDescription.trim().length < 5) {
    errs.hazardDescription = "Hazard description must contain at least 5 characters";
  }
  if (state.likelihood === 0 || state.severity === 0) {
    errs.inherent = "Please select likelihood and severity from the matrix above";
  }
  return errs;
}

export function buildRiskAssessmentDTO(
  residentId: string,
  state: FormState,
  status?: RiskStatus
): CreateRiskAssessmentDTO {
  const factors = state.whoCouldBeHarmed.trim() ? [`Who could be harmed: ${state.whoCouldBeHarmed.trim()}`] : undefined;
  const stdControls = state.controlsText.split("\n").map((l) => l.trim()).filter(Boolean).map((d) => ({ description: d, isExisting: false }));
  const faControls = state.furtherActions.map((fa) => ({ description: `Action: ${fa.action} (Owner: ${fa.ownerName}${fa.dueDate ? `, Due: ${fa.dueDate}` : ""})`, isExisting: false }));

  return {
    residentId,
    templateId: (state.templateId && state.templateId.trim()) ? state.templateId : undefined,
    category: state.category as RiskCategory,
    title: state.title,
    hazardDescription: state.hazardDescription,
    tool: state.tool || undefined,
    likelihood: state.likelihood,
    severity: state.severity,
    status,
    reviewFrequency: (state.reviewFrequency || "Quarterly") as ReviewFrequency,
    factors,
    controls: [...stdControls, ...faControls],
  };
}

export function parseAssessmentToFormState(
  assessment: RiskAssessmentResponse
): FormState {
  const factors = Array.isArray(assessment.factors)
    ? (assessment.factors as string[])
    : [];
  const whoHarmedFactor = factors.find((f) =>
    f.startsWith("Who could be harmed: ")
  );
  const whoCouldBeHarmed = whoHarmedFactor
    ? whoHarmedFactor.replace("Who could be harmed: ", "")
    : "";

  const allControls = assessment.controls || [];
  const controlsText = allControls
    .filter((c) => !c.description.startsWith("Action: "))
    .map((c) => c.description)
    .join("\n");

  const furtherActions: FurtherAction[] = allControls
    .filter((c) => c.description.startsWith("Action: "))
    .map((c) => {
      const match = c.description.match(
        /^Action:\s*(.*?)\s*\(Owner:\s*([^,)]*)(?:,\s*Due:\s*([^)]*))?\)/
      );
      const datePart = c.dueDate ? c.dueDate.split("T")[0] : undefined;
      return {
        action: (match && match[1]) ? match[1] : c.description,
        ownerId: c.assignedToId || "",
        ownerName: (match && match[2]) ? match[2] : "",
        dueDate: datePart ?? (match?.[3] ?? ""),
      };
    });

  return {
    templateId: assessment.templateId,
    category: assessment.category,
    title: assessment.title,
    hazardDescription: assessment.hazardDescription,
    whoCouldBeHarmed,
    tool: assessment.tool || "",
    likelihood: assessment.likelihood,
    severity: assessment.severity,
    reviewFrequency: (assessment.reviewFrequency || "Quarterly") as ReviewFrequency,
    controlsText,
    furtherActions,
  };
}
