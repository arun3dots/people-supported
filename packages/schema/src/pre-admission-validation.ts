import { z } from "zod";
import {
  PRE_ADMISSION_CARE_LEVELS,
  PreAdmissionContactSchema,
  PreAdmissionPartASchema,
  PreAdmissionPartBSchema,
  PreAdmissionPartCSchema,
  PreAdmissionPartDSchema,
  PreAdmissionPartESchema,
  PreAdmissionPartFSchema,
  PreAdmissionPartGSchema,
  type PreAdmissionPartADTO,
  type PreAdmissionPartBDTO,
  type PreAdmissionPartCDTO,
  type PreAdmissionPartDDTO,
  type PreAdmissionPartEDTO,
  type PreAdmissionPartFDTO,
  type PreAdmissionPartGDTO,
} from "./pre-admission-parts";
import {
  PreAdmissionRoomAllocationSchema,
  type PreAdmissionPartKey,
  type PreAdmissionRoomAllocationDTO,
} from "./pre-admission";

// --- Step-level Mandatory Validation Schemas ---

export const MandatoryPreAdmissionPartASchema = PreAdmissionPartASchema.extend({
  firstName: z
    .string({ required_error: "First name is required" })
    .trim()
    .min(1, "First name is required"),
  lastName: z
    .string({ required_error: "Last name is required" })
    .trim()
    .min(1, "Last name is required"),
  dob: z
    .string({ required_error: "Date of birth is required" })
    .trim()
    .min(1, "Date of birth is required")
    .refine((v) => {
      if (!v) return false;
      const parsed = new Date(v);
      if (isNaN(parsed.getTime())) return false;
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return parsed <= today;
    }, "Date of birth cannot be a future date"),
  gender: z
    .string({ required_error: "Gender is required" })
    .trim()
    .min(1, "Gender is required"),
  maritalStatus: z
    .string({ required_error: "Marital status is required" })
    .trim()
    .min(1, "Marital status is required"),
  // Format is not enforced here: the NHS number is captured as recorded by the
  // assessor (it is encrypted at rest and reconciled later if needed).
  nhsNumber: z.string().trim().nullable().optional(),
  previousAddress: z
    .string({ required_error: "Previous address is required" })
    .trim()
    .min(1, "Previous address is required"),
  language: z
    .string({ required_error: "Preferred language is required" })
    .trim()
    .min(1, "Preferred language is required"),
  stayType: z.enum(["Permanent", "Respite", "Short-term"], {
    errorMap: () => ({ message: "Type of stay is required" }),
  }),
  typeOfCare: z
    .string({ required_error: "Type of care is required" })
    .trim()
    .min(1, "Type of care is required"),
  careLevel: z.enum(PRE_ADMISSION_CARE_LEVELS, {
    errorMap: () => ({ message: "Level of care is required" }),
  }),
  admittedFrom: z
    .string({ required_error: "Admitted from is required" })
    .trim()
    .min(1, "Admitted from is required"),
  admissionReason: z
    .string({ required_error: "Reason for admission is required" })
    .trim()
    .min(1, "Reason for admission is required"),
});
export type MandatoryPreAdmissionPartADTO = z.infer<
  typeof MandatoryPreAdmissionPartASchema
>;

export const MandatoryPreAdmissionPartBSchema = PreAdmissionPartBSchema.extend({
  nextOfKin: z
    .array(
      PreAdmissionContactSchema.extend({
        name: z
          .string({ required_error: "Next of kin name is required" })
          .trim()
          .min(1, "Next of kin name is required"),
      }).refine(
        (c) => Boolean(c.phone?.trim() || c.email?.trim()),
        {
          message: "At least one contact method (phone or email) is required",
          path: ["phone"],
        },
      ),
    )
    .min(1, "At least one next of kin is required"),
});
export type MandatoryPreAdmissionPartBDTO = z.infer<
  typeof MandatoryPreAdmissionPartBSchema
>;

export const MandatoryPreAdmissionPartCSchema = PreAdmissionPartCSchema.superRefine(
  (data, ctx) => {
    const hasPrimary =
      Boolean(data.primaryDiagnosis?.trim()) ||
      Boolean(data.diagnoses?.[0]?.trim());
    if (!hasPrimary) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Primary diagnosis is required",
        path: ["primaryDiagnosis"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Primary diagnosis is required",
        path: ["diagnoses"],
      });
    }
    if (
      !data.noKnownAllergies &&
      (!Array.isArray(data.allergies) || data.allergies.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Record allergies or confirm none are known",
        path: ["allergies"],
      });
    }
  },
);
export type MandatoryPreAdmissionPartCDTO = z.infer<
  typeof MandatoryPreAdmissionPartCSchema
>;

export const MandatoryPreAdmissionPartESchema =
  PreAdmissionPartESchema.superRefine((data, ctx) => {
    const move = data.moveDecision;
    if (!move || typeof move.hasCapacity !== "boolean") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Record the capacity decision about the move (Has capacity or Lacks capacity)",
        path: ["moveDecision", "hasCapacity"],
      });
      return;
    }

    const capacityFields: Array<
      [keyof typeof move, string | null | undefined, string]
    > = [
      ["assessedAt", move.assessedAt, "Capacity assessment date is required"],
      [
        "assessedByName",
        move.assessedByName,
        "Capacity assessed by is required",
      ],
      [
        "summary",
        move.summary,
        "Capacity assessment summary is required",
      ],
    ];
    for (const [field, value, message] of capacityFields) {
      if (!value?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message,
          path: ["moveDecision", field as string],
        });
      }
    }

    if (move.hasCapacity === false) {
      const bi = move.bestInterests;
      if (!bi) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Record the best-interests decision because the person lacks capacity",
          path: ["moveDecision", "bestInterests"],
        });
        return;
      }
      const bestInterestFields: Array<
        [string, string | null | undefined, string]
      > = [
        [
          "decidedAt",
          bi.decidedAt,
          "Best-interests decision date is required",
        ],
        [
          "decisionMaker",
          bi.decisionMaker,
          "Best-interests decision maker is required",
        ],
        ["rationale", bi.rationale, "Best-interests rationale is required"],
      ];
      for (const [field, value, message] of bestInterestFields) {
        if (!value?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message,
            path: ["moveDecision", "bestInterests", field],
          });
        }
      }
    }
  });
export type MandatoryPreAdmissionPartEDTO = z.infer<
  typeof MandatoryPreAdmissionPartESchema
>;

export const MandatoryPreAdmissionRoomAllocationSchema =
  PreAdmissionRoomAllocationSchema.extend({
    bedId: z.preprocess(
      (value) => value ?? "",
      z.string().trim().min(1, "Bed allocation is required"),
    ),
    roomNumber: z.preprocess(
      (value) => value ?? "",
      z.string().trim().min(1, "Room number is required"),
    ),
  });
export type MandatoryPreAdmissionRoomAllocationDTO = z.infer<
  typeof MandatoryPreAdmissionRoomAllocationSchema
>;

export const MANDATORY_PART_SCHEMAS = {
  partA: MandatoryPreAdmissionPartASchema,
  partB: MandatoryPreAdmissionPartBSchema,
  partC: MandatoryPreAdmissionPartCSchema,
  partD: PreAdmissionPartDSchema,
  partE: MandatoryPreAdmissionPartESchema,
  partF: PreAdmissionPartFSchema,
  partG: PreAdmissionPartGSchema,
  roomAllocation: MandatoryPreAdmissionRoomAllocationSchema,
} as const;

export interface StepValidationIssue {
  field: string;
  message: string;
}

export interface StepValidationResult {
  success: boolean;
  issues: StepValidationIssue[];
  firstError?: string;
}

export function validateStepOnSave(
  step: number,
  data: unknown,
  context?: { riskAssessmentsCount?: number; hasAssessmentNeeds?: boolean },
): StepValidationResult {
  if (step === 5) {
    const count = context?.riskAssessmentsCount ?? 0;
    if (count <= 0) {
      const message = "Please record at least one clinical risk assessment before continuing.";
      return {
        success: false,
        issues: [{ field: "riskAssessments", message }],
        firstError: message,
      };
    }
    return { success: true, issues: [] };
  }

  if (step === 6) {
    if (!context?.hasAssessmentNeeds) {
      const message = "Please record findings and support levels for at least one area of need before continuing.";
      return {
        success: false,
        issues: [{ field: "needs", message }],
        firstError: message,
      };
    }
    return { success: true, issues: [] };
  }

  const stepPartMap: Record<number, PreAdmissionPartKey | null> = {
    1: "partA",
    2: "partG",
    3: "partB",
    4: "partC",
    5: null,
    6: null,
    7: "partD",
    8: "partE",
    9: "partF",
    10: "roomAllocation",
    11: null,
  };

  const part = stepPartMap[step];
  if (!part) {
    return { success: true, issues: [] };
  }

  const schema = MANDATORY_PART_SCHEMAS[part];
  if (!schema) {
    return { success: true, issues: [] };
  }

  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, issues: [] };
  }

  const issues: StepValidationIssue[] = result.error.issues.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));

  return {
    success: false,
    issues,
    firstError: issues[0]?.message,
  };
}

export interface PreAdmissionSubmitIssue {
  part: PreAdmissionPartKey;
  field: string;
  message: string;
}

type PartsInput = Partial<{
  partA: PreAdmissionPartADTO | null;
  partB: PreAdmissionPartBDTO | null;
  partC: PreAdmissionPartCDTO | null;
  partD: PreAdmissionPartDDTO | null;
  partE: PreAdmissionPartEDTO | null;
  partF: PreAdmissionPartFDTO | null;
  partG: PreAdmissionPartGDTO | null;
  roomAllocation: PreAdmissionRoomAllocationDTO | null;
}>;

export interface PreAdmissionSubmitOptions {
  hasAssessmentNeeds?: boolean;
}

/** Required-on-submit checks; validates cross-section completion before manager decision. */
export function getPreAdmissionSubmitIssues(
  parts: PartsInput,
  options?: PreAdmissionSubmitOptions,
): PreAdmissionSubmitIssue[] {
  const issues: PreAdmissionSubmitIssue[] = [];
  const need = (
    part: PreAdmissionPartKey,
    field: string,
    ok: unknown,
    message: string,
  ) => {
    if (!ok) issues.push({ part, field, message });
  };
  const a = parts.partA;
  need("partA", "firstName", a?.firstName?.trim(), "First name is required");
  need("partA", "lastName", a?.lastName?.trim(), "Last name is required");
  need("partA", "dob", a?.dob?.trim(), "Date of birth is required");
  need("partA", "gender", a?.gender?.trim(), "Gender is required");
  need("partA", "maritalStatus", a?.maritalStatus?.trim(), "Marital status is required");
  need("partA", "nhsNumber", a?.nhsNumber?.trim(), "NHS number is required");
  need("partA", "previousAddress", a?.previousAddress?.trim(), "Previous address is required");
  need("partA", "language", a?.language?.trim(), "Preferred language is required");
  need("partA", "stayType", a?.stayType, "Type of stay is required");
  need("partA", "typeOfCare", a?.typeOfCare?.trim(), "Type of care is required");
  need("partA", "careLevel", a?.careLevel, "Level of care is required");
  need("partA", "admittedFrom", a?.admittedFrom?.trim(), "Admitted from is required");
  need("partA", "admissionReason", a?.admissionReason?.trim(), "Reason for admission is required");
  need("partB", "nextOfKin", parts.partB?.nextOfKin?.length, "At least one next of kin is required");
  const c = parts.partC;
  need("partC", "diagnoses", c?.diagnoses?.length, "At least one diagnosis is required");
  need(
    "partC",
    "allergies",
    c?.allergies?.length || c?.noKnownAllergies,
    "Record allergies or confirm none are known",
  );
  const hasNeeds =
    Boolean(options?.hasAssessmentNeeds) ||
    Object.keys(parts.partD?.areas ?? {}).length > 0;
  need("partD", "areas", hasNeeds, "Record at least one care need area");
  const partE = parts.partE;
  const move = partE?.moveDecision;
  const hasCapacityDecision =
    move != null && typeof move.hasCapacity === "boolean";
  need(
    "partE",
    "moveDecision",
    hasCapacityDecision,
    "Record the capacity decision about the move",
  );
  if (hasCapacityDecision) {
    need("partE", "assessedAt", move?.assessedAt?.trim(), "Capacity assessment date is required");
    need(
      "partE",
      "assessedByName",
      move?.assessedByName?.trim(),
      "Capacity assessed by is required",
    );
    need("partE", "summary", move?.summary?.trim(), "Capacity assessment summary is required");
    if (move?.hasCapacity === false) {
      need(
        "partE",
        "bestInterests",
        move.bestInterests != null,
        "Record the best-interests decision because the person lacks capacity",
      );
      need(
        "partE",
        "bestInterests.decidedAt",
        move.bestInterests?.decidedAt?.trim(),
        "Best-interests decision date is required",
      );
      need(
        "partE",
        "bestInterests.decisionMaker",
        move.bestInterests?.decisionMaker?.trim(),
        "Best-interests decision maker is required",
      );
      need(
        "partE",
        "bestInterests.rationale",
        move.bestInterests?.rationale?.trim(),
        "Best-interests rationale is required",
      );
    }
  }
  return issues;
}

export interface PreAdmissionBannerFields {
  allergySummary: string | null;
  fallsRiskLevel: string | null;
  iddsiLevel: string | null;
  dnacprStatus: string | null;
}

/** Values mirrored onto Resident for the header banner and list. */
export function derivePreAdmissionBanner(
  parts: PartsInput,
): PreAdmissionBannerFields {
  const c = parts.partC;
  const allergySummary = c?.allergies?.length
    ? c.allergies
        .map((x) => (x.reaction ? `${x.substance} (${x.reaction})` : x.substance))
        .join(", ")
    : c?.noKnownAllergies
      ? "No known allergies"
      : null;
  return {
    allergySummary,
    fallsRiskLevel: parts.partD?.fallsRiskLevel ?? null,
    iddsiLevel: parts.partD?.iddsiLevel ?? null,
    dnacprStatus: parts.partF?.dnacpr?.status ?? null,
  };
}
