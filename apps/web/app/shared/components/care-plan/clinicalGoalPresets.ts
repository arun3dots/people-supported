export interface ClinicalGoalPreset {
  id: string;
  name: string;
  category: string;
  title: string;
  targetDescription: string;
  reviewFrequency: string;
  trackingMode: "weight" | "fluid" | "milestone" | "routine";
  defaultMetrics?: {
    unit?: string;
    baseline?: number;
    current?: number;
    target?: number;
    dailyTargetMl?: number;
  };
}

export const CLINICAL_GOAL_PRESETS: ClinicalGoalPreset[] = [
  {
    id: "weight-must",
    name: "Weight Stabilisation / MUST 2+ Action",
    category: "Nutrition",
    title: "Weight Gain & Nutritional Intake Optimisation",
    targetDescription: "Target Weight: 60 kg (Baseline: 52 kg). Aim to achieve healthy BMI through fortified meals and prescribed supplements.",
    reviewFrequency: "Weekly",
    trackingMode: "weight",
    defaultMetrics: { unit: "kg", baseline: 52, current: 52, target: 60 },
  },
  {
    id: "hydration-target",
    name: "Daily Hydration & Fluid Target",
    category: "Nutrition",
    title: "Maintain Adequate Daily Hydration",
    targetDescription: "Daily Fluid Target: 1,800 ml/day (Minimum safe threshold: 1,500 ml/day) to prevent acute dehydration and UTI risks.",
    reviewFrequency: "Daily",
    trackingMode: "fluid",
    defaultMetrics: { dailyTargetMl: 1800 },
  },
  {
    id: "safe-mobility",
    name: "Safe Mobilisation & Fall Prevention",
    category: "Mobility",
    title: "Independent Mobilisation with Walking Frame",
    targetDescription: "Mobilise safely with Zimmer frame and 1 care staff assistance for transfers, progressing to independent transfers.",
    reviewFrequency: "Weekly",
    trackingMode: "milestone",
  },
  {
    id: "pressure-care",
    name: "Pressure Care & Skin Integrity",
    category: "Clinical",
    title: "Preserve Intact Skin & Prevent Pressure Ulcers",
    targetDescription: "Zero category 2+ pressure damage. Dynamic alternating mattress compliance and 2-hourly repositioning routine.",
    reviewFrequency: "Weekly",
    trackingMode: "routine",
  },
  {
    id: "oral-hygiene",
    name: "Oral Hygiene & Personal Care Routine",
    category: "Personal Care",
    title: "Twice-Daily Assisted Oral Hygiene & Dental Health",
    targetDescription: "Twice-daily assisted teeth brushing and denture hygiene routine to maintain oral comfort and prevent respiratory infection.",
    reviewFrequency: "Weekly",
    trackingMode: "routine",
  },
];
