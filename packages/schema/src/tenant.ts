import { z } from "zod";
import { customPackageSchema } from "./billing";

export const createTenantSchema = z.object({
  name: z
    .string()
    .min(2, "Care home name must be at least 2 characters")
    .max(100, "Care home name must not exceed 100 characters")
    .regex(
      /^(?!\s*$)[a-zA-Z0-9\s\-'.&()]+$/,
      "Care home name can only contain letters, numbers, spaces, and basic punctuation (- ' . & ())",
    ),
  subdomain: z
    .string()
    .min(2, "Subdomain must be at least 2 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Subdomain can only contain lowercase letters, numbers, and hyphens",
    ),
  cqcNumber: z.string().optional().nullable(),
  cqcProviderId: z.string().optional().nullable(),
  cqcLocationId: z.string().optional().nullable(),
  addressLine1: z
    .string()
    .min(3, "Address must be at least 3 characters")
    .max(150, "Address must not exceed 150 characters")
    .regex(
      /^(?!\s*$)[a-zA-Z0-9\s\-',./#]+$/,
      "Address contains invalid characters",
    ),
  addressLine2: z.string().optional().nullable(),
  city: z
    .string()
    .min(2, "Town / City must be at least 2 characters")
    .max(50, "Town / City must not exceed 50 characters")
    .regex(
      /^[a-zA-Z\s\-']+$/,
      "Town / City can only contain letters, spaces, hyphens, and apostrophes",
    ),
  postcode: z
    .string()
    .min(5, "Postcode must be at least 5 characters")
    .max(10, "Postcode must not exceed 10 characters")
    .regex(
      /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i,
      "Please enter a valid UK postcode (e.g. SW1A 1AA)",
    ),
  primaryContactName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(70, "Full name must not exceed 70 characters")
    .regex(
      /^[a-zA-Z\s\-'.]+$/,
      "Full name can only contain letters, spaces, hyphens, and apostrophes",
    ),
  primaryContactEmail: z.string().email("Invalid email address"),
  primaryContactPhone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(20, "Phone number must not exceed 20 characters")
    .regex(
      /^(?:\+?[0-9]{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}$/,
      "Please enter a valid mobile or phone number (e.g. +44 20 1234 5678 or 07700 900888)",
    )
    .refine(
      (val) => !/[a-zA-Z@]/.test(val) && val.replace(/\D/g, "").length >= 10,
      {
        message:
          "Phone number cannot contain letters or email characters and must have at least 10 digits",
      },
    ),
  password: z.string().min(8, "Password must be at least 8 characters"),
  packageId: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  agreeTerms: z.boolean().optional(),
  dpaVersion: z.string().optional().nullable(),
  privacyNoticeVersion: z.string().optional().nullable(),
  enforceMfaForAllStaff: z.boolean().optional(),
  enablePageViewGeolocation: z.boolean().optional(),
});

export const updateTenantSchema = z.object({
  name: z
    .string()
    .min(2, "Care home name must be at least 2 characters")
    .max(100, "Care home name must not exceed 100 characters")
    .regex(
      /^(?!\s*$)[a-zA-Z0-9\s\-'.&()]+$/,
      "Care home name can only contain letters, numbers, spaces, and basic punctuation (- ' . & ())",
    )
    .optional(),
  subdomain: z
    .string()
    .min(2, "Subdomain must be at least 2 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Subdomain can only contain lowercase letters, numbers, and hyphens",
    )
    .or(z.literal(""))
    .optional()
    .nullable(),
  cqcNumber: z.string().optional().nullable(),
  cqcProviderId: z.string().optional().nullable(),
  cqcLocationId: z.string().optional().nullable(),
  addressLine1: z
    .string()
    .min(3, "Address must be at least 3 characters")
    .max(150, "Address must not exceed 150 characters")
    .regex(
      /^(?!\s*$)[a-zA-Z0-9\s\-',./#]+$/,
      "Address contains invalid characters",
    )
    .optional()
    .nullable(),
  addressLine2: z.string().optional().nullable(),
  city: z
    .string()
    .min(2, "Town / City must be at least 2 characters")
    .max(50, "Town / City must not exceed 50 characters")
    .regex(
      /^[a-zA-Z\s\-']+$/,
      "Town / City can only contain letters, spaces, hyphens, and apostrophes",
    )
    .optional()
    .nullable(),
  postcode: z
    .string()
    .min(5, "Postcode must be at least 5 characters")
    .max(10, "Postcode must not exceed 10 characters")
    .regex(
      /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i,
      "Please enter a valid UK postcode (e.g. SW1A 1AA)",
    )
    .optional()
    .nullable(),
  primaryContactName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(70, "Full name must not exceed 70 characters")
    .regex(
      /^[a-zA-Z\s\-'.]+$/,
      "Full name can only contain letters, spaces, hyphens, and apostrophes",
    )
    .optional()
    .nullable(),
  primaryContactEmail: z
    .string()
    .email("Invalid email address")
    .or(z.literal(""))
    .optional()
    .nullable(),
  primaryContactPhone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(20, "Phone number must not exceed 20 characters")
    .regex(
      /^(?:\+?[0-9]{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}$/,
      "Please enter a valid mobile or phone number",
    )
    .refine(
      (val) => !/[a-zA-Z@]/.test(val) && val.replace(/\D/g, "").length >= 10,
      {
        message:
          "Phone number cannot contain letters or email characters and must have at least 10 digits",
      },
    )
    .optional()
    .nullable(),
  packageId: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  agreeTerms: z.boolean().optional(),
  dpaVersion: z.string().optional().nullable(),
  privacyNoticeVersion: z.string().optional().nullable(),
  enforceMfaForAllStaff: z.boolean().optional(),
  enablePageViewGeolocation: z.boolean().optional(),
});

export const superAdminCreateTenantSchema = createTenantSchema.extend({
  customPackage: customPackageSchema.optional(),
});

export const publicOnboardingSchema = createTenantSchema
  .omit({ packageId: true })
  .extend({
    cqcNumber: z
      .string()
      .regex(/^1-\d+$/, "Use the CQC format 1- followed by digits")
      .or(z.literal(""))
      .optional()
      .nullable(),
    cqcProviderId: z
      .string()
      .regex(/^1-\d+$/, "Use the CQC format 1- followed by digits")
      .or(z.literal(""))
      .optional()
      .nullable(),
    cqcLocationId: z
      .string()
      .regex(/^1-\d+$/, "Use the CQC format 1- followed by digits")
      .or(z.literal(""))
      .optional()
      .nullable(),
    packageId: z.string().min(1, "Please select a package"),
  });

export const tenantStatusSchema = z.enum([
  "Pending",
  "Active",
  "Suspended",
  "Inactive",
]);

export const tenantDocumentSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  fileUrl: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
  category: z.string().default("Statutory"),
  documentUrl: z.string().optional(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]).optional(),
});

export const acceptDpaSchema = z.object({
  dpaVersion: z.string().min(1).default("v1.0-2026-10"),
  privacyNoticeVersion: z.string().min(1).default("v1.0-2026-10"),
  acceptedByName: z.string().min(2).max(100).optional(),
  enforceMfaForAllStaff: z.boolean().optional(),
  enablePageViewGeolocation: z.boolean().optional(),
});

export type CreateTenantDTO = z.infer<typeof createTenantSchema>;
export type UpdateTenantDTO = z.infer<typeof updateTenantSchema>;
export type SuperAdminCreateTenantDTO = z.infer<
  typeof superAdminCreateTenantSchema
>;
export type PublicOnboardingDTO = z.infer<typeof publicOnboardingSchema>;
export type TenantStatus = z.infer<typeof tenantStatusSchema>;
export type TenantDocumentDTO = z.infer<typeof tenantDocumentSchema>;
export type AcceptDpaDTO = z.infer<typeof acceptDpaSchema>;
