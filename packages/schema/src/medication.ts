import { z } from "zod";

export const MEDICATION_FORMS = [
  "Tablet",
  "Capsule",
  "Liquid / Syrup",
  "Inhaler",
  "Injection",
  "Topical Cream / Ointment",
  "Eye Drops",
  "Ear Drops",
  "Transdermal Patch",
  "Suppository",
] as const;

export const CreateMedicationRoundSchema = z.object({
  drugName: z.string().min(1, "Drug name is required"),
  dose: z.string().min(1, "Dose is required"),
  form: z.string().min(1, "Form is required"),
  instructions: z.string().optional(),
  imageUrls: z.array(z.string()).optional().default([]),
  scheduledTime: z.string().or(z.date()),
  allowLateAdministration: z.boolean().optional().default(false),
  mandatoryObservations: z.array(z.string()).optional(),
  isAdhoc: z.boolean().optional(),
});

export const CreateMedicationRoundBulkSchema = z.object({
  drugName: z.string().min(1, "Drug name is required"),
  dose: z.string().min(1, "Dose is required"),
  form: z.string().min(1, "Form is required"),
  instructions: z.string().optional(),
  imageUrls: z.array(z.string()).optional().default([]),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  allowLateAdministration: z.boolean().optional().default(false),
  mandatoryObservations: z.array(z.string()).optional(),
  times: z.array(
    z
      .string()
      .regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Invalid time format (HH:mm)",
      ),
  ),
});

export const AdministerMedicationSchema = z.object({
  roundId: z.string().uuid(),
  status: z.enum(["Given", "Refused", "Omitted", "NPO"]),
  reason: z.string().optional(),
  residentId: z.string().uuid(),
  vitals: z.record(z.unknown()).optional(),
  // Controlled Drug (CD) Dual-Witness Sign-Off
  witnessId: z.string().optional(),
  witnessName: z.string().optional(),
  witnessRole: z.string().optional(),
  witnessPin: z.string().optional(),
  witnessSignature: z.string().optional(),
});

export const AdministerAdHocMedicationSchema = z.object({
  drugName: z.string().min(1, "Drug name is required"),
  dose: z.string().min(1, "Dose is required"),
  form: z.string().min(1, "Form is required"),
  instructions: z.string().optional(),
  imageUrls: z.array(z.string()).optional().default([]),
  status: z.enum(["Given", "Refused", "Omitted", "NPO"]),
  reason: z.string().optional(),
  residentId: z.string().uuid(),
  vitals: z.record(z.unknown()).optional(),
  witnessId: z.string().optional(),
  witnessName: z.string().optional(),
  witnessRole: z.string().optional(),
  witnessPin: z.string().optional(),
  witnessSignature: z.string().optional(),
});

export const DeleteMedicationRoundSchema = z.object({
  reason: z.string().trim().min(1, "Deletion reason is required").max(500),
});

const backdateReasonField = z
  .string()
  .trim()
  .max(500)
  .optional();

export const StopMedicationPrescriptionSchema = z.object({
  effectiveDate: z.string().or(z.date()),
  reason: z.string().trim().min(1, "Stop reason is required").max(500),
  backdateReason: backdateReasonField,
});

export const ChangeMedicationPrescriptionSchema = z.object({
  effectiveDate: z.string().or(z.date()),
  reason: z.string().trim().min(1, "Change reason is required").max(500),
  backdateReason: backdateReasonField,
  drugName: z.string().min(1, "Drug name is required"),
  dose: z.string().min(1, "Dose is required"),
  form: z.string().min(1, "Form is required"),
  instructions: z.string().optional(),
  imageUrls: z.array(z.string()).optional().default([]),
  endDate: z.string().or(z.date()),
  allowLateAdministration: z.boolean().optional().default(false),
  mandatoryObservations: z.array(z.string()).optional(),
  times: z.array(
    z
      .string()
      .regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Invalid time format (HH:mm)",
      ),
  ),
});

export const PauseMedicationPrescriptionSchema = z
  .object({
    pauseFrom: z.string().or(z.date()),
    resumeOn: z.string().or(z.date()),
    reason: z.string().trim().min(1, "Pause reason is required").max(500),
    backdateReason: backdateReasonField,
  })
  .refine((v) => new Date(v.resumeOn) > new Date(v.pauseFrom), {
    message: "Resume date must be after the pause start date",
    path: ["resumeOn"],
  });

// B-06: eMAR Administration Strike-Through Amendment
export const AmendMedAdministrationSchema = z.object({
  status: z.enum(["Given", "Refused", "Omitted", "NPO"]),
  reason: z.string().optional(),
  correctionReason: z
    .string()
    .trim()
    .min(5, "Correction reason is required")
    .max(500),
  witnessId: z.string().optional(),
  witnessName: z.string().optional(),
  witnessRole: z.string().optional(),
  witnessSignature: z.string().optional(),
});

// C-07 & G-05: Controlled Drug Register (Misuse of Drugs Regs 2001 & NICE SC1)
export const CreateControlledDrugEntrySchema = z.object({
  residentId: z.string().uuid(),
  prescriptionId: z.string().uuid().optional().nullable(),
  drugName: z.string().min(1),
  strength: z.string().min(1),
  form: z.string().min(1),
  entryType: z.enum([
    "Receipt",
    "Administration",
    "Disposal",
    "BalanceCheck",
    "Transfer",
  ]),
  quantityIn: z.number().min(0).default(0),
  quantityOut: z.number().min(0).default(0),
  runningBalance: z.number().min(0),
  witnessById: z
    .string()
    .min(1, "Dual witness ID is mandatory for Controlled Drugs"),
  witnessByName: z
    .string()
    .min(1, "Dual witness name is mandatory for Controlled Drugs"),
  witnessSignature: z.string().optional().nullable(),
  disposalMethod: z
    .enum(["DenaturingKit", "PharmacyReturn"])
    .optional()
    .nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

// C-07 & G-05: Medication Stock Ledger & Running Balance
export const CreateMedicationStockTransactionSchema = z.object({
  residentId: z.string().uuid(),
  prescriptionId: z.string().uuid().optional().nullable(),
  drugName: z.string().min(1),
  batchNumber: z.string().optional().nullable(),
  expiryDate: z.string().or(z.date()).optional().nullable(),
  transactionType: z.enum([
    "Received",
    "Administered",
    "Wasted",
    "ReturnedToPharmacy",
    "CarriedForward",
    "Adjusted",
  ]),
  quantityDelta: z.number(),
  balanceAfter: z.number().min(0),
  witnessById: z.string().optional().nullable(),
  reason: z.string().max(500).optional().nullable(),
});

export type CreateMedicationRoundDTO = z.infer<
  typeof CreateMedicationRoundSchema
>;
export type CreateMedicationRoundBulkDTO = z.infer<
  typeof CreateMedicationRoundBulkSchema
>;
export type AdministerMedicationDTO = z.infer<
  typeof AdministerMedicationSchema
>;
export type AdministerAdHocMedicationDTO = z.infer<
  typeof AdministerAdHocMedicationSchema
>;
export type DeleteMedicationRoundDTO = z.infer<
  typeof DeleteMedicationRoundSchema
>;
export type StopMedicationPrescriptionDTO = z.infer<
  typeof StopMedicationPrescriptionSchema
>;
export type ChangeMedicationPrescriptionDTO = z.infer<
  typeof ChangeMedicationPrescriptionSchema
>;
export type PauseMedicationPrescriptionDTO = z.infer<
  typeof PauseMedicationPrescriptionSchema
>;
export type AmendMedAdministrationDTO = z.infer<
  typeof AmendMedAdministrationSchema
>;
export type CreateControlledDrugEntryDTO = z.infer<
  typeof CreateControlledDrugEntrySchema
>;
export type CreateMedicationStockTransactionDTO = z.infer<
  typeof CreateMedicationStockTransactionSchema
>;
