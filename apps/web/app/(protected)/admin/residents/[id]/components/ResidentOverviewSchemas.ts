import { z } from "zod";
import { isInvalidResidentName, RESIDENT_NAME_ERROR } from "@repo/schema";
import { isOptionalPhoneValid } from "../../../../resident/admit/utils/phoneValidation";

export type EditSection = "about" | "personal" | "nok" | "gp" | "funding";

export interface OverviewFormData {
  aboutBio: string;
  firstName: string;
  middleName: string;
  lastName: string;
  addressLine1: string;
  city: string;
  country: string;
  phoneNumber: string;
  religion: string;
  email: string;
  nhsNumber: string;
  dob: string;
  preferredLanguage: string;
  nokFirstName: string;
  nokMiddleName: string;
  nokLastName: string;
  nokName: string;
  nokPhone: string;
  nokRelation: string;
  secondaryNokFirstName: string;
  secondaryNokMiddleName: string;
  secondaryNokLastName: string;
  secondaryNokName: string;
  secondaryNokPhone: string;
  secondaryNokRelation: string;
  fundingType: string;
  localAuthority: string;
  payer: string;
}

export const PersonalSectionSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .refine((val) => !isInvalidResidentName(val), RESIDENT_NAME_ERROR),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .refine((val) => !isInvalidResidentName(val), RESIDENT_NAME_ERROR),
  middleName: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || !isInvalidResidentName(val), RESIDENT_NAME_ERROR),
  email: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      "Please enter a valid email address"
    ),
  phoneNumber: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || isOptionalPhoneValid(val), "Invalid phone number (7-15 digits)"),
  nhsNumber: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^\d{10}$/.test(val.replace(/\s+/g, "")),
      "NHS number must be exactly 10 digits"
    ),
});

export const NokSectionSchema = z.object({
  nokFirstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .refine((val) => !isInvalidResidentName(val), RESIDENT_NAME_ERROR),
  nokLastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .refine((val) => !isInvalidResidentName(val), RESIDENT_NAME_ERROR),
  nokMiddleName: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || !isInvalidResidentName(val), RESIDENT_NAME_ERROR),
  nokPhone: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || isOptionalPhoneValid(val), "Invalid phone number (7-15 digits)"),
  nokRelation: z.string().trim().min(1, "Relationship is required"),
  secondaryNokFirstName: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || !isInvalidResidentName(val), RESIDENT_NAME_ERROR),
  secondaryNokLastName: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || !isInvalidResidentName(val), RESIDENT_NAME_ERROR),
  secondaryNokMiddleName: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || !isInvalidResidentName(val), RESIDENT_NAME_ERROR),
  secondaryNokPhone: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || isOptionalPhoneValid(val), "Invalid phone number (7-15 digits)"),
});

export const FundingSectionSchema = z.object({
  fundingType: z.string().trim().min(1, "Primary payment method is required"),
});

