import { TemplateDef } from "./types";

export const nutritionTemplate: TemplateDef = {
  id: "demo-template-nutrition",
  name: "Nutritional, Hydration & Dysphagia Needs Assessment (MUST & IDDSI)",
  category: "Nutrition",
  description: "Evidence-based nutritional evaluation covering BAPEN MUST score, choking risk screening, and IDDSI diet and fluid modifications.",
  isDefault: false,
  sections: [
    {
      id: "sec-must-screening",
      title: "Malnutrition Universal Screening Tool (MUST)",
      goal: "Calculate baseline malnutrition risk score, track weight trends, and establish fortifying dietary interventions.",
      questions: [
        {
          id: "q-nut-bmi",
          section: "Malnutrition Universal Screening Tool (MUST)",
          questionText: "Current Body Mass Index (BMI) bracket:",
          type: "radio",
          options: [
            "Healthy weight (BMI 20.0 - 24.9)",
            "Overweight (BMI 25.0 - 29.9)",
            "Underweight (BMI 18.5 - 19.9) - MUST Score 1",
            "Severely underweight (BMI < 18.5) - MUST Score 2",
          ],
          answer: "Underweight (BMI 18.5 - 19.9) - MUST Score 1",
        },
        {
          id: "q-nut-weightloss",
          section: "Malnutrition Universal Screening Tool (MUST)",
          questionText: "Unplanned weight loss in past 3 to 6 months:",
          type: "radio",
          options: [
            "No weight loss / Stable weight (< 5%)",
            "5% - 10% unplanned weight loss - MUST Score 1",
            "> 10% significant unplanned weight loss - MUST Score 2",
            "History of rapid hospital discharge cachexia",
          ],
          answer: "5% - 10% unplanned weight loss - MUST Score 1",
        },
        {
          id: "q-nut-mustrisk",
          section: "Malnutrition Universal Screening Tool (MUST)",
          questionText: "Overall MUST Risk Category & Action Plan:",
          type: "radio",
          options: [
            "Low Risk (Score 0) - Routine monthly weight check",
            "Medium Risk (Score 1) - Weekly weights, food fortification & 3-day food diary",
            "High Risk (Score 2+) - Prescribed ONS supplements twice daily & dietitian referral",
          ],
          answer: "High Risk (Score 2+) - Prescribed ONS supplements twice daily & dietitian referral",
        },
      ],
    },
    {
      id: "sec-dysphagia-iddsi",
      title: "Swallowing Safety & IDDSI Texture Levels",
      goal: "Screen for dysphagia and prevent aspiration pneumonia through certified IDDSI food and fluid consistency.",
      questions: [
        {
          id: "q-nut-swallowsigns",
          section: "Swallowing Safety & IDDSI Texture Levels",
          questionText: "Clinical signs of dysphagia / swallowing difficulties observed:",
          type: "checkbox",
          options: [
            "No signs of swallowing difficulty",
            "Coughing or throat clearing during/after swallowing",
            "Wet, gargly voice quality after drinking",
            "Prolonged chewing or holding/pocketing food in mouth",
            "Pain on swallowing (odynophagia)",
            "Recent episode of aspiration pneumonia",
          ],
          answer: ["Coughing or throat clearing during/after swallowing", "Wet, gargly voice quality after drinking"],
        },
        {
          id: "q-nut-iddsifood",
          section: "Swallowing Safety & IDDSI Texture Levels",
          questionText: "Speech & Language Therapy (SALT) recommended Food Texture (IDDSI Levels 3-7):",
          type: "select",
          options: [
            "Level 7 - Regular Normal Diet",
            "Level 7 - Easy to Chew",
            "Level 6 - Soft & Bite-Sized (max 15mm bite sizes)",
            "Level 5 - Minced & Moist (max 4mm particles, lumps easily mashed)",
            "Level 4 - Pureed Diet (smooth, no lumps, falls off spoon in dollop)",
            "Level 3 - Liquidised Diet",
          ],
          answer: "Level 5 - Minced & Moist (max 4mm particles, lumps easily mashed)",
        },
        {
          id: "q-nut-iddsifluid",
          section: "Swallowing Safety & IDDSI Texture Levels",
          questionText: "Prescribed Fluid Thickness (IDDSI Levels 0-4):",
          type: "select",
          options: [
            "Level 0 - Thin Fluids (Standard water, tea, coffee)",
            "Level 1 - Slightly Thick",
            "Level 2 - Mildly Thick (runs off spoon quickly, leaves thin coating)",
            "Level 3 - Moderately Thick (effort required to drink through straw)",
            "Level 4 - Extremely Thick (eaten with spoon, cannot be sipped)",
          ],
          answer: "Level 2 - Mildly Thick (runs off spoon quickly, leaves thin coating)",
        },
      ],
    },
    {
      id: "sec-meal-assistance",
      title: "Mealtime Assistance & Hydration Support",
      goal: "Identify eating independence, adaptive aids, and daily fluid target.",
      questions: [
        {
          id: "q-nut-assistlevel",
          section: "Mealtime Assistance & Hydration Support",
          questionText: "Physical mealtime assistance level:",
          type: "radio",
          options: [
            "Fully independent",
            "Requires verbal prompting / cutting up food / opening packets",
            "Intermittent physical assistance / hand-over-hand guidance",
            "Full 1:1 feeding assistance for all meals and drinks",
          ],
          answer: "Intermittent physical assistance / hand-over-hand guidance",
        },
        {
          id: "q-nut-fluidtarget",
          section: "Mealtime Assistance & Hydration Support",
          questionText: "Daily hydration fluid target (ml) and balance chart monitoring:",
          type: "radio",
          options: [
            "Standard target (1500ml/day) - Routine checks",
            "Elevated target (1800ml - 2000ml/day) - Fluid balance chart monitored daily",
            "Fluid restriction ordered by nephrologist/cardiologist (specify max ml)",
          ],
          answer: "Elevated target (1800ml - 2000ml/day) - Fluid balance chart monitored daily",
        },
      ],
    },
  ],
};
