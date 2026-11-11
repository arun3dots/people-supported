import { z } from "zod";

// ────────────────────────────────────────────────────────
// Right to Work (RTW) Schemas
// ────────────────────────────────────────────────────────

const rtwVerificationTypes = ["Manual", "ShareCode", "IDVT"] as const;
const rtwStatuses = [
  "Pending",
  "Verified",
  "Expired",
  "Requires Follow-up",
] as const;

const baseRtwSchema = z.object({
  verificationType: z.enum(rtwVerificationTypes),
  rtwStatus: z.enum(rtwStatuses).default("Pending"),
  verificationDate: z
    .string()
    .or(z.date())
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return new Date(val) <= new Date();
      },
      { message: "Verification date cannot be in the future" },
    ),
  verifierName: z.string().optional(),
  expiryDate: z.string().or(z.date()).optional().nullable(),
  workRestrictions: z.string().optional().nullable(),
  documentUrl: z.string().url().optional().nullable(),
});

// Path A: Manual Verification (British/Irish Citizens)
export const manualRtwSchema = baseRtwSchema.extend({
  verificationType: z.literal("Manual"),
  documentType: z.string().min(1, "Document type is required"),
  documentNumber: z.string().min(1, "Document number is required"),
  issueDate: z.string().or(z.date()),
});

// Path B: Online Share Code Verification (Visa/Settled Status)
export const shareCodeRtwSchema = baseRtwSchema.extend({
  verificationType: z.literal("ShareCode"),
  shareCode: z
    .string()
    .regex(/^[A-Za-z0-9]{9}$/, "Share code must be 9 alphanumeric characters"),
  documentType: z.string().optional(),
});

// Path C: Digital Verification (IDVT)
export const idvtRtwSchema = baseRtwSchema.extend({
  verificationType: z.literal("IDVT"),
  idvtProvider: z.string().min(1, "IDVT Provider is required"),
  transactionRef: z.string().min(1, "Transaction Reference is required"),
});

// Union discriminated schema
export const createRtwSchema = z.discriminatedUnion("verificationType", [
  manualRtwSchema,
  shareCodeRtwSchema,
  idvtRtwSchema,
]);

export const updateRtwSchema = baseRtwSchema.partial().extend({
  verificationType: z.enum(rtwVerificationTypes).optional(),
  documentType: z.string().optional(),
  documentNumber: z.string().optional(),
  issueDate: z.string().or(z.date()).optional(),
  shareCode: z.string().optional(),
  idvtProvider: z.string().optional(),
  transactionRef: z.string().optional(),
});

// ────────────────────────────────────────────────────────
// DBS Check Schemas
// ────────────────────────────────────────────────────────

const dbsTypes = [
  "Standard",
  "Enhanced",
  "Enhanced with Barred List",
] as const;
const dbsStatuses = ["Pending", "Clear", "Action Required", "Expired"] as const;

export const createDbsCheckSchema = z.object({
  certificateNumber: z.string().min(1, "Certificate number is required"),
  type: z.enum(dbsTypes),
  issueDate: z.string().or(z.date()).optional().nullable(),
  expiryDate: z.string().or(z.date()).optional().nullable(),
  updateService: z.boolean().default(false),
  status: z.enum(dbsStatuses).default("Pending"),
  documentUrl: z.string().url().optional().nullable(),
});

export const updateDbsCheckSchema = createDbsCheckSchema.partial();

// ────────────────────────────────────────────────────────
// Staff Certification Schemas
// ────────────────────────────────────────────────────────

const certStatuses = ["Valid", "Expiring Soon", "Expired"] as const;

export const createCertificationSchema = z.object({
  name: z.string().min(1, "Certification name is required"),
  skills: z.array(z.string()).default([]),
  issueDate: z.string().or(z.date()),
  expiryDate: z.string().or(z.date()),
  status: z.enum(certStatuses).default("Valid"),
  certificateUrl: z.string().url().optional().nullable(),
});

export const updateCertificationSchema = createCertificationSchema.partial();

// ────────────────────────────────────────────────────────
// Health Clearance Schemas
// ────────────────────────────────────────────────────────

const healthStatuses = ["Cleared", "Pending", "Restricted"] as const;

export const createHealthClearanceSchema = z.object({
  clearanceDate: z.string().or(z.date()).optional(),
  status: z.enum(healthStatuses).default("Pending"),
  notes: z.string().optional().nullable(),
  documentUrl: z.string().optional().nullable(),
});

export const updateHealthClearanceSchema =
  createHealthClearanceSchema.partial();

// ────────────────────────────────────────────────────────
// Immunisation Schemas
// ────────────────────────────────────────────────────────

const immunisationStatuses = [
  "Up to date",
  "Requires Booster",
  "Pending",
  "Overdue",
] as const;

export const createImmunisationSchema = z.object({
  name: z.string().min(1, "Immunisation name is required"),
  dateAdministered: z.string().or(z.date()),
  status: z.enum(immunisationStatuses).default("Up to date"),
});

export const updateImmunisationSchema = createImmunisationSchema.partial();

// ────────────────────────────────────────────────────────
// Inferred Types
// ────────────────────────────────────────────────────────

export type CreateRtwDTO = z.infer<typeof createRtwSchema>;
export type UpdateRtwDTO = z.infer<typeof updateRtwSchema>;
export type CreateDbsCheckDTO = z.infer<typeof createDbsCheckSchema>;
export type UpdateDbsCheckDTO = z.infer<typeof updateDbsCheckSchema>;
export type CreateCertificationDTO = z.infer<typeof createCertificationSchema>;
export type UpdateCertificationDTO = z.infer<typeof updateCertificationSchema>;
export type CreateHealthClearanceDTO = z.infer<
  typeof createHealthClearanceSchema
>;
export type UpdateHealthClearanceDTO = z.infer<
  typeof updateHealthClearanceSchema
>;
export type CreateImmunisationDTO = z.infer<typeof createImmunisationSchema>;
export type UpdateImmunisationDTO = z.infer<typeof updateImmunisationSchema>;

// Status type exports
export type RtwStatus = (typeof rtwStatuses)[number];
export type DbsStatus = (typeof dbsStatuses)[number];
export type CertStatus = (typeof certStatuses)[number];
export type HealthStatus = (typeof healthStatuses)[number];
export type ImmunisationStatus = (typeof immunisationStatuses)[number];
