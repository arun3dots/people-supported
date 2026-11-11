import { z } from "zod";
import {
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

export * from "./pre-admission-parts";

export const PRE_ADMISSION_STATUSES = [
  "Draft",
  "Submitted",
  "Accepted",
  "Declined",
  "Superseded",
] as const;
export const PreAdmissionStatusEnum = z.enum(PRE_ADMISSION_STATUSES);
export type PreAdmissionStatus = z.infer<typeof PreAdmissionStatusEnum>;

export const PRE_ADMISSION_PARTS = [
  "partA",
  "partB",
  "partC",
  "partD",
  "partE",
  "partF",
  "partG",
  "roomAllocation",
] as const;
export const PreAdmissionPartKeyEnum = z.enum(PRE_ADMISSION_PARTS);
export type PreAdmissionPartKey = z.infer<typeof PreAdmissionPartKeyEnum>;

export const PreAdmissionManagerDecisionSchema = z.object({
  decision: z.enum(["Accepted", "Declined", "NeedsMoreInformation"]),
  rationale: z.string().trim().min(1, "A rationale is required"),
  signedByName: z.string().trim().min(1, "Signer name is required"),
  signedRole: z.string().trim().min(1, "Signer role is required"),
  signedAt: z.string().optional(),
});
export type PreAdmissionManagerDecisionDTO = z.infer<
  typeof PreAdmissionManagerDecisionSchema
>;

// Step after Part G: room/bed, belongings and assistive devices.
export const PreAdmissionRoomAllocationSchema = z.object({
  bedId: z.string().nullable().optional(),
  roomNumber: z.string().nullable().optional(),
  roomType: z.string().nullable().optional(),
  moveInDateTime: z.string().nullable().optional(),
  roommateId: z.string().nullable().optional(),
  belongings: z
    .array(
      z.object({
        item: z.string().min(1),
        description: z.string().nullable().optional(),
        estValue: z.number().nonnegative().nullable().optional(),
        conditionPhotoUrl: z.string().nullable().optional(),
      }),
    )
    .default([]),
  assistiveDevices: z.array(z.string()).default([]),
  liabilityWaiverSigned: z.boolean().default(false),
  valuablesInSafe: z.boolean().default(false),
  valuablesDescription: z.string().nullable().optional(),
});
export type PreAdmissionRoomAllocationDTO = z.infer<
  typeof PreAdmissionRoomAllocationSchema
>;

export const PRE_ADMISSION_PART_SCHEMAS = {
  partA: PreAdmissionPartASchema,
  partB: PreAdmissionPartBSchema,
  partC: PreAdmissionPartCSchema,
  partD: PreAdmissionPartDSchema,
  partE: PreAdmissionPartESchema,
  partF: PreAdmissionPartFSchema,
  partG: PreAdmissionPartGSchema,
  roomAllocation: PreAdmissionRoomAllocationSchema,
} as const;

import { MandatoryPreAdmissionPartASchema } from "./pre-admission-validation";
export * from "./pre-admission-validation";

export const CreatePreAdmissionSchema = z.object({
  branchId: z.string().uuid("Invalid branch selected").optional(),
  assessedAt: z.string().optional(),
  assessedLocation: z.string().trim().optional(),
  partA: MandatoryPreAdmissionPartASchema,
});
export type CreatePreAdmissionDTO = z.infer<typeof CreatePreAdmissionSchema>;

export const UpdatePreAdmissionMetaSchema = z.object({
  assessedAt: z.string().nullable().optional(),
  assessedLocation: z.string().trim().nullable().optional(),
  assessedByName: z.string().trim().nullable().optional(),
});
export type UpdatePreAdmissionMetaDTO = z.infer<
  typeof UpdatePreAdmissionMetaSchema
>;

export const PreAdmissionPartParamSchema = z.object({
  part: PreAdmissionPartKeyEnum,
});

export type PreAdmissionPartDataMap = {
  partA: PreAdmissionPartADTO;
  partB: PreAdmissionPartBDTO;
  partC: PreAdmissionPartCDTO;
  partD: PreAdmissionPartDDTO;
  partE: PreAdmissionPartEDTO;
  partF: PreAdmissionPartFDTO;
  partG: PreAdmissionPartGDTO;
  roomAllocation: PreAdmissionRoomAllocationDTO;
};

export interface PreAdmissionRecordDTO {
  id: string;
  residentId: string;
  versionNumber: number;
  status: PreAdmissionStatus;
  isCurrent: boolean;
  assessedAt: string | null;
  assessedLocation: string | null;
  assessedByName: string | null;
  partA: PreAdmissionPartADTO | null;
  partB: PreAdmissionPartBDTO | null;
  partC: PreAdmissionPartCDTO | null;
  partD: PreAdmissionPartDDTO | null;
  partE: PreAdmissionPartEDTO | null;
  partF: PreAdmissionPartFDTO | null;
  partG: PreAdmissionPartGDTO | null;
  roomAllocation: PreAdmissionRoomAllocationDTO | null;
  managerDecision: PreAdmissionManagerDecisionDTO | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
