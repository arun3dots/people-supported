import { z } from "zod";

export const PRSBStandardDomainEnum = z.enum([
  "AboutMe",
  "CommunicationSensory",
  "MentalCognitionBehaviour",
  "MobilityFalls",
  "NutritionHydration",
  "ContinenceElimination",
  "PersonalHygieneDressing",
  "SkinIntegrityPressureCare",
  "MedicationClinical",
  "BreathingCirculationVitals",
  "SleepNightCare",
  "SocialInterestsRelationships",
  "AdvanceCarePlanningDNACPR",
]);
export type PRSBStandardDomain = z.infer<typeof PRSBStandardDomainEnum>;

export const IDDSIFoodLevelEnum = z.enum([
  "Regular_Level7",
  "SoftAndBiteSized_Level6",
  "MincedAndMoist_Level5",
  "Pureed_Level4",
  "Liquidised_Level3",
]);
export type IDDSIFoodLevel = z.infer<typeof IDDSIFoodLevelEnum>;

export const IDDSIFluidLevelEnum = z.enum([
  "Thin_Level0",
  "SlightlyThick_Level1",
  "MildlyThick_Level2",
  "ModeratelyThick_Level3",
  "ExtremelyThick_Level4",
]);
export type IDDSIFluidLevel = z.infer<typeof IDDSIFluidLevelEnum>;

export const MustRiskCategoryEnum = z.enum(["Low", "Medium", "High"]);
export type MustRiskCategory = z.infer<typeof MustRiskCategoryEnum>;

export const MustAssessmentSchema = z.object({
  id: z.string().optional(),
  residentId: z.string().min(1, "Resident is required"),
  tenantId: z.string().optional(),
  heightCm: z.number().min(50).max(250),
  weightKg: z.number().min(20).max(300),
  bmi: z.number(),
  bmiScore: z.number().min(0).max(2),
  unplannedWeightLossPercent: z.number().min(0).max(100),
  weightLossScore: z.number().min(0).max(2),
  acuteDiseaseEffect: z.boolean(),
  acuteDiseaseScore: z.number().min(0).max(2),
  totalScore: z.number().min(0),
  riskCategory: MustRiskCategoryEnum,
  foodTexture: IDDSIFoodLevelEnum.optional(),
  fluidConsistency: IDDSIFluidLevelEnum.optional(),
  assessedAt: z.date().or(z.string()),
  assessorId: z.string().optional(),
  assessorName: z.string().optional(),
  notes: z.string().optional(),
});
export type MustAssessmentDTO = z.infer<typeof MustAssessmentSchema>;

export const CreateMustAssessmentSchema = MustAssessmentSchema.omit({
  id: true,
  tenantId: true,
  assessorName: true,
});
export type CreateMustAssessmentDTO = z.infer<typeof CreateMustAssessmentSchema>;

export const WaterlowRiskCategoryEnum = z.enum(["Low", "High", "VeryHigh"]);
export type WaterlowRiskCategory = z.infer<typeof WaterlowRiskCategoryEnum>;

export const WaterlowAssessmentSchema = z.object({
  id: z.string().optional(),
  residentId: z.string().min(1, "Resident is required"),
  tenantId: z.string().optional(),
  buildWeightScore: z.number().min(0).max(3),
  skinTypeScore: z.number().min(0).max(3),
  sexAgeScore: z.number().min(1).max(5),
  continenceScore: z.number().min(0).max(3),
  mobilityScore: z.number().min(0).max(5),
  nutritionScore: z.number().min(0).max(2),
  tissueMalnutritionScore: z.number().min(0).max(8),
  neurologicalDeficitScore: z.number().min(0).max(6),
  surgeryTraumaScore: z.number().min(0).max(8),
  totalScore: z.number().min(0),
  riskCategory: WaterlowRiskCategoryEnum,
  assessedAt: z.date().or(z.string()),
  assessorId: z.string().optional(),
  assessorName: z.string().optional(),
  notes: z.string().optional(),
});
export type WaterlowAssessmentDTO = z.infer<typeof WaterlowAssessmentSchema>;

export const CreateWaterlowAssessmentSchema = WaterlowAssessmentSchema.omit({
  id: true,
  tenantId: true,
  assessorName: true,
});
export type CreateWaterlowAssessmentDTO = z.infer<typeof CreateWaterlowAssessmentSchema>;

// Helper function to calculate MUST score and category
export function calculateMustScore(
  heightCm: number,
  weightKg: number,
  weightLossPercent: number,
  acuteDiseaseEffect: boolean
): {
  bmi: number;
  bmiScore: number;
  weightLossScore: number;
  acuteDiseaseScore: number;
  totalScore: number;
  riskCategory: MustRiskCategory;
} {
  const heightM = heightCm / 100;
  const bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;

  // Step 1: BMI Score
  let bmiScore = 0;
  if (bmi < 18.5) {
    bmiScore = 2;
  } else if (bmi <= 20) {
    bmiScore = 1;
  }

  // Step 2: Weight Loss Score
  let weightLossScore = 0;
  if (weightLossPercent > 10) {
    weightLossScore = 2;
  } else if (weightLossPercent >= 5) {
    weightLossScore = 1;
  }

  // Step 3: Acute Disease Effect Score
  const acuteDiseaseScore = acuteDiseaseEffect ? 2 : 0;

  const totalScore = bmiScore + weightLossScore + acuteDiseaseScore;

  let riskCategory: MustRiskCategory = "Low";
  if (totalScore >= 2) {
    riskCategory = "High";
  } else if (totalScore === 1) {
    riskCategory = "Medium";
  }

  return {
    bmi,
    bmiScore,
    weightLossScore,
    acuteDiseaseScore,
    totalScore,
    riskCategory,
  };
}

// Helper function to calculate Waterlow category
export function calculateWaterlowCategory(totalScore: number): WaterlowRiskCategory {
  if (totalScore >= 20) return "VeryHigh";
  if (totalScore >= 15) return "High";
  return "Low";
}
