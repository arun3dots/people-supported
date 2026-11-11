import { z } from "zod";
import {
  AssessmentRatingEnum,
  AssessmentAreaKeySchema,
  type AssessmentAreaKey,
} from "./assessment";
import { SupportLevelEnum, type SupportLevel } from "./pre-admission-parts";

const text = z.string().trim().nullable().optional();

export const NEED_CARE_PLAN_STATUSES = ["Draft", "Agreed", "Superseded"] as const;
export const NeedCarePlanStatusEnum = z.enum(NEED_CARE_PLAN_STATUSES);
export type NeedCarePlanStatus = z.infer<typeof NeedCarePlanStatusEnum>;

export const NeedCarePlanContentSchema = z.object({
  source: text,
  found: text,
  needs: text,
  prefs: text,
  strengths: text,
  consultationPeople: z
    .array(z.object({ name: z.string(), role: z.string() }))
    .optional(),
  outcome: text,
  steps: z.array(z.string().trim().min(1)).default([]),
  monitor: text,
  escalation: text,
  consent: text,
  restrictions: text,
  whatINeed: text,
  howToSupportMe: text,
  staffing: text,
});
export type NeedCarePlanContentDTO = z.infer<typeof NeedCarePlanContentSchema>;

export const NeedCarePlanRiskSchema = z.object({
  toolKey: z.string().nullable().optional(),
  name: z.string(),
  value: z.string(),
  rating: AssessmentRatingEnum,
});
export type NeedCarePlanRiskDTO = z.infer<typeof NeedCarePlanRiskSchema>;

const CreateNeedCarePlanFields = {
  area: z.string().trim().min(1).optional(),
  supportLevel: SupportLevelEnum.nullable().optional(),
  content: NeedCarePlanContentSchema,
  reviewDate: z.string().nullable().optional(),
  risk: NeedCarePlanRiskSchema.nullable().optional(),
};

export const CreateNeedCarePlanSchema = z
  .object({
    ...CreateNeedCarePlanFields,
    areaKey: AssessmentAreaKeySchema,
  })
  .superRefine((data, ctx) => {
    if (data.areaKey.startsWith("custom:") && !data.area) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["area"],
        message: "Custom care plans require an area name",
      });
    }
  });
export type CreateNeedCarePlanDTO = z.infer<typeof CreateNeedCarePlanSchema>;

export const SaveNeedCarePlanSchema = z.object({
  area: z.string().trim().min(1).optional(),
  supportLevel: SupportLevelEnum.nullable().optional(),
  content: NeedCarePlanContentSchema,
  reviewDate: z.string().nullable().optional(),
  risk: NeedCarePlanRiskSchema.nullable().optional(),
});
export type SaveNeedCarePlanDTO = z.infer<typeof SaveNeedCarePlanSchema>;

export const NeedCarePlanAgreementSchema = z.object({
  agreedBy: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        role: z.string().trim().min(1),
      }),
    )
    .min(1, "Record who agreed this plan"),
  note: text,
});
export type NeedCarePlanAgreementDTO = z.infer<
  typeof NeedCarePlanAgreementSchema
>;

export interface NeedCarePlanRecordDTO {
  id: string;
  residentId: string;
  assessmentId: string | null;
  areaKey: AssessmentAreaKey;
  area: string;
  supportLevel: SupportLevel | null;
  risk: NeedCarePlanRiskDTO | null;
  content: NeedCarePlanContentDTO;
  agreement: (NeedCarePlanAgreementDTO & { agreedAt: string }) | null;
  status: NeedCarePlanStatus;
  versionNumber: number;
  isCurrent: boolean;
  reviewDate: string | null;
  agreedAt: string | null;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}
