import { z } from "zod";

// --- Emergency Directory (read-only, break-glass style access) ---

export const EmergencyDirectoryItemSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  preferredName: z.string().nullable(),
  age: z.number().int().nullable(),
  gender: z.string().nullable(),
  roomNumber: z.string().nullable(),
  bedLabel: z.string().nullable(),
  wingName: z.string().nullable(),
  photoUrl: z.string().nullable(),
  status: z.string(),
  dnacpr: z.boolean(),
  hasAllergies: z.boolean(),
  isAssigned: z.boolean(),
});
export type EmergencyDirectoryItemDTO = z.infer<typeof EmergencyDirectoryItemSchema>;

export const EmergencyDirectoryResponseSchema = z.object({
  assigned: z.array(EmergencyDirectoryItemSchema),
  others: z.array(EmergencyDirectoryItemSchema),
  total: z.number().int(),
});
export type EmergencyDirectoryResponseDTO = z.infer<typeof EmergencyDirectoryResponseSchema>;

export const EmergencyContactSummarySchema = z.object({
  name: z.string(),
  relationship: z.string().nullable(),
  phone: z.string().nullable(),
  isPrimary: z.boolean(),
});
export type EmergencyContactSummaryDTO = z.infer<typeof EmergencyContactSummarySchema>;

export const EmergencyMedicationSummarySchema = z.object({
  drugName: z.string(),
  dose: z.string(),
  form: z.string(),
  times: z.array(z.string()),
  instructions: z.string().nullable(),
});
export type EmergencyMedicationSummaryDTO = z.infer<typeof EmergencyMedicationSummarySchema>;

export const EmergencyObservationSummarySchema = z.object({
  timestamp: z.string(),
  news2Score: z.number().nullable(),
  temp: z.number().nullable(),
  pulse: z.number().nullable(),
  bpSystolic: z.number().nullable(),
  bpDiastolic: z.number().nullable(),
  respiration: z.number().nullable(),
  spo2: z.number().nullable(),
  consciousness: z.string().nullable(),
});
export type EmergencyObservationSummaryDTO = z.infer<typeof EmergencyObservationSummarySchema>;

export const EmergencyContactPersonSchema = z.object({
  role: z.string(),
  name: z.string().nullable(),
  phone: z.string().nullable(),
});
export type EmergencyContactPersonDTO = z.infer<typeof EmergencyContactPersonSchema>;

export const EmergencyResidentSummarySchema = z.object({
  id: z.string(),
  fullName: z.string(),
  preferredName: z.string().nullable(),
  dob: z.string().nullable(),
  age: z.number().int().nullable(),
  gender: z.string().nullable(),
  nhsNumber: z.string().nullable(),
  photoUrl: z.string().nullable(),
  status: z.string(),
  roomNumber: z.string().nullable(),
  bedLabel: z.string().nullable(),
  wingName: z.string().nullable(),
  dnacpr: z.boolean(),
  allergies: z.object({
    medication: z.array(z.string()),
    food: z.array(z.string()),
    other: z.array(z.string()),
  }),
  primaryDiagnosis: z.string().nullable(),
  secondaryDiagnoses: z.array(z.string()),
  chronicConditions: z.array(z.string()),
  medications: z.array(EmergencyMedicationSummarySchema),
  latestObservation: EmergencyObservationSummarySchema.nullable(),
  emergencyContacts: z.array(EmergencyContactSummarySchema),
  gp: z
    .object({
      name: z.string().nullable(),
      practice: z.string().nullable(),
      phone: z.string().nullable(),
    })
    .nullable(),
  careProviders: z.array(EmergencyContactPersonSchema),
  mobility: z.object({
    summary: z.string().nullable(),
    aids: z.array(z.string()),
    fallRisk: z.string().nullable(),
  }),
  diet: z.object({
    dietType: z.string().nullable(),
    textureModification: z.string().nullable(),
    requirements: z.array(z.string()),
  }),
  communication: z.object({
    ability: z.string().nullable(),
    preferredLanguage: z.string().nullable(),
    interpreterRequired: z.boolean(),
    sensoryAids: z.array(z.string()),
  }),
});
export type EmergencyResidentSummaryDTO = z.infer<typeof EmergencyResidentSummarySchema>;
