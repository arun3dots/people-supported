import { z } from "zod";
import { isOptionalPhoneValid } from "../../../../resident/admit/utils/phoneValidation";

export interface CareProviderItem {
  type: string;
  name: string;
  clinic?: string;
  phone?: string;
}

export const CareProviderItemSchema = z.object({
  type: z.string().min(1, "Provider type is required"),
  name: z.string().optional().or(z.literal("")),
  clinic: z.string().optional().or(z.literal("")),
  phone: z
    .string()
    .refine((v) => !v || isOptionalPhoneValid(v), "Invalid phone number (must be 7–15 digits)")
    .optional()
    .or(z.literal("")),
});

export const EditCareProvidersSchema = z.object({
  gpPractice: z.string().optional().or(z.literal("")),
  gpName: z.string().optional().or(z.literal("")),
  gpPhone: z
    .string()
    .refine((v) => !v || isOptionalPhoneValid(v), "Invalid GP phone number (must be 7–15 digits)")
    .optional()
    .or(z.literal("")),
  otherProviders: z.array(CareProviderItemSchema).optional(),
});

