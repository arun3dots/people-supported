import { z } from "zod";

export const TransferPackResidentSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  preferredName: z.string().nullable().optional(),
  dateOfBirth: z.date().or(z.string()).nullable().optional(),
  nhsNumber: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  roomNumber: z.string().nullable().optional(),
});
export type TransferPackResident = z.infer<typeof TransferPackResidentSchema>;

export const TransferPackEmergencyContactSchema = z.object({
  name: z.string(),
  relationship: z.string(),
  phone: z.string(),
});
export type TransferPackEmergencyContact = z.infer<typeof TransferPackEmergencyContactSchema>;

export const TransferPackLegalDirectivesSchema = z.object({
  dnacprInPlace: z.boolean(),
  dnacprLocation: z.string().optional(),
  hasCapacity: z.boolean(),
  lpaHealthAndWelfareName: z.string().nullable().optional(),
  lpaContact: z.string().nullable().optional(),
  dolsInPlace: z.boolean(),
  dolsSupervisoryBody: z.string().nullable().optional(),
  dolsExpiryDate: z.date().or(z.string()).nullable().optional(),
});
export type TransferPackLegalDirectives = z.infer<typeof TransferPackLegalDirectivesSchema>;

export const TransferPackBaselineCareSchema = z.object({
  mobility: z.string(),
  transferAssistance: z.string().optional(),
  nutrition: z.string(),
  iddsiFood: z.string().optional(),
  iddsiFluid: z.string().optional(),
  mustScore: z.number().optional(),
  continence: z.string().optional(),
  skinIntegrity: z.string().optional(),
  waterlowScore: z.number().optional(),
  communicationNeeds: z.string().optional(),
  sensoryImpairments: z.string().optional(),
});
export type TransferPackBaselineCare = z.infer<typeof TransferPackBaselineCareSchema>;

export const TransferPackVitalsSchema = z.object({
  news2Score: z.number().nullable().optional(),
  consciousness: z.string().nullable().optional(), // ACVPU
  spo2: z.number().nullable().optional(),
  bloodPressure: z.string().nullable().optional(),
  pulse: z.number().nullable().optional(),
  temperature: z.number().nullable().optional(),
  respirationRate: z.number().nullable().optional(),
  recordedAt: z.date().or(z.string()).nullable().optional(),
});
export type TransferPackVitals = z.infer<typeof TransferPackVitalsSchema>;

export const TransferPackMedicationSchema = z.object({
  drugName: z.string(),
  dose: z.string(),
  frequency: z.string(),
  route: z.string().optional(),
  instructions: z.string().nullable().optional(),
});
export type TransferPackMedication = z.infer<typeof TransferPackMedicationSchema>;

export const HospitalTransferPackSchema = z.object({
  generatedAt: z.date().or(z.string()),
  reasonForTransfer: z.string().default("Urgent Hospital Admission / Ambulance Assessment"),
  careHome: z.object({
    name: z.string(),
    phone: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    registeredManager: z.string().nullable().optional(),
  }),
  resident: TransferPackResidentSchema,
  emergencyContacts: z.array(TransferPackEmergencyContactSchema).default([]),
  legalDirectives: TransferPackLegalDirectivesSchema,
  baselineCare: TransferPackBaselineCareSchema,
  latestVitals: TransferPackVitalsSchema.optional(),
  activeMedications: z.array(TransferPackMedicationSchema).default([]),
  medicalConditions: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
});
export type HospitalTransferPackDTO = z.infer<typeof HospitalTransferPackSchema>;

export const GenerateTransferPackInputSchema = z.object({
  residentId: z.string().min(1, "Resident ID is required"),
  carePlanId: z.string().optional(),
  reasonForTransfer: z.string().optional(),
});
export type GenerateTransferPackInputDTO = z.infer<typeof GenerateTransferPackInputSchema>;
