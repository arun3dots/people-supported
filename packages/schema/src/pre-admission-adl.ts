import { z } from "zod";

const text = z.string().trim().nullable().optional();

export const PRE_ADMISSION_ADL_ASSISTANCE_LEVELS = [
  "Independent",
  "Supervision",
  "Partial assistance",
  "Total assistance",
] as const;

export const PRE_ADMISSION_ADL_ACTIVITIES = [
  { key: "bathing", label: "Bathing" },
  { key: "grooming", label: "Grooming (hair care, shaving, etc.)" },
  { key: "oralCare", label: "Oral care" },
  { key: "dressing", label: "Dressing" },
  { key: "clothingUpperBody", label: "Clothing upper body" },
  { key: "clothingLowerBody", label: "Clothing lower body" },
  { key: "footwear", label: "Putting on/taking off shoes" },
  { key: "feeding", label: "Feeding (does not include meal preparation)" },
  { key: "feedingWithUtensils", label: "Feeding (using utensils)" },
  { key: "drinking", label: "Drinking (using cups or glasses)" },
  { key: "mealPreparation", label: "Meal preparation" },
  { key: "medicationManagement", label: "Medication management" },
] as const;

export type PreAdmissionAdlAssistanceLevel =
  (typeof PRE_ADMISSION_ADL_ASSISTANCE_LEVELS)[number];

const PreAdmissionAdlActivityEntrySchema = z.object({
  assistanceLevel: z
    .enum(PRE_ADMISSION_ADL_ASSISTANCE_LEVELS)
    .nullable()
    .optional(),
  comments: text,
});

export const PreAdmissionAdlChecklistSchema = z
  .object({
    bathing: PreAdmissionAdlActivityEntrySchema.optional(),
    grooming: PreAdmissionAdlActivityEntrySchema.optional(),
    oralCare: PreAdmissionAdlActivityEntrySchema.optional(),
    dressing: PreAdmissionAdlActivityEntrySchema.optional(),
    clothingUpperBody: PreAdmissionAdlActivityEntrySchema.optional(),
    clothingLowerBody: PreAdmissionAdlActivityEntrySchema.optional(),
    footwear: PreAdmissionAdlActivityEntrySchema.optional(),
    feeding: PreAdmissionAdlActivityEntrySchema.optional(),
    feedingWithUtensils: PreAdmissionAdlActivityEntrySchema.optional(),
    drinking: PreAdmissionAdlActivityEntrySchema.optional(),
    mealPreparation: PreAdmissionAdlActivityEntrySchema.optional(),
    medicationManagement: PreAdmissionAdlActivityEntrySchema.optional(),
  })
  .default({});

export type PreAdmissionAdlChecklistDTO = z.infer<
  typeof PreAdmissionAdlChecklistSchema
>;

