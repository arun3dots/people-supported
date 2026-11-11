import { TemplateDef } from "./types";

export const nursingTemplate: TemplateDef = {
  id: "demo-template-nursing",
  name: "Complex Clinical & High-Dependency Nursing Assessment",
  category: "Nursing",
  description: "In-depth clinical assessment for residents requiring 24/7 Registered Nurse (RGN) oversight, wound dressings, enteral feeding, or invasive devices.",
  isDefault: false,
  sections: [
    {
      id: "sec-vitals-news2",
      title: "Vital Signs, NEWS2 & Clinical Stability",
      goal: "Establish clinical baseline, physiological monitoring frequency, and escalation thresholds.",
      questions: [
        {
          id: "q-nur-news2",
          section: "Vital Signs, NEWS2 & Clinical Stability",
          questionText: "Physiological monitoring (NEWS2) baseline & observation frequency:",
          type: "radio",
          options: [
            "Stable: Monthly routine observations",
            "Weekly vital signs monitoring",
            "Daily NEWS2 monitoring required (bradycardia, labile BP)",
            "Twice daily or PRN monitoring for acute clinical instability",
          ],
          answer: "Weekly vital signs monitoring",
        },
        {
          id: "q-nur-respiratory",
          section: "Vital Signs, NEWS2 & Clinical Stability",
          questionText: "Respiratory support & oxygen therapy requirements:",
          type: "checkbox",
          options: [
            "No respiratory support",
            "Continuous oxygen therapy via nasal cannula (specify LPM)",
            "PRN Oxygen concentrator/cylinder",
            "Nebuliser therapy prescribed (Salbutamol/Ipratropium)",
            "Suction machine required at bedside",
          ],
          answer: ["Nebuliser therapy prescribed (Salbutamol/Ipratropium)"],
        },
      ],
    },
    {
      id: "sec-enteral-invasives",
      title: "Enteral Feeding & Invasive Appliances",
      goal: "Document protocol for PEG/PEJ/NG tubes, infusion pumps, and urinary/stoma appliances.",
      questions: [
        {
          id: "q-nur-peg",
          section: "Enteral Feeding & Invasive Appliances",
          questionText: "Enteral nutrition (PEG / NG tube) management:",
          type: "radio",
          options: [
            "None - Oral diet only",
            "Percutaneous Endoscopic Gastrostomy (PEG) - Continuous nocturnal pump feed",
            "PEG - Bolus feeds via gravity syringe 4x daily",
            "Requires sterile water flushes and site dressing daily",
          ],
          answer: "None - Oral diet only",
        },
        {
          id: "q-nur-catheter",
          section: "Enteral Feeding & Invasive Appliances",
          questionText: "Urinary catheter & invasive elimination appliances:",
          type: "radio",
          options: [
            "No invasive devices",
            "Urethral indwelling catheter (Foley) - Size 12-16Fr with leg/night bag",
            "Suprapubic catheter (SPC) with sterile site dressings",
            "Urostomy / Nephrostomy tube monitoring required",
          ],
          answer: "Urethral indwelling catheter (Foley) - Size 12-16Fr with leg/night bag",
        },
      ],
    },
    {
      id: "sec-wound-dressings",
      title: "Wound Management & Tissue Breakdown",
      goal: "Track complex wounds, pressure injuries, surgical sites, and dressing regimens.",
      questions: [
        {
          id: "q-nur-wounds",
          section: "Wound Management & Tissue Breakdown",
          questionText: "Current active wounds or pressure ulcers:",
          type: "checkbox",
          options: [
            "Skin intact (no active wounds)",
            "EPUAP Category 2 Pressure Ulcer (partial thickness blister/abrasion)",
            "EPUAP Category 3/4 Pressure Ulcer (full thickness tissue loss/cavity)",
            "Venous leg ulcers requiring four-layer compression bandaging",
            "Surgical wound / dehiscence monitoring",
          ],
          answer: ["EPUAP Category 2 Pressure Ulcer (partial thickness blister/abrasion)"],
        },
        {
          id: "q-nur-dressingprotocol",
          section: "Wound Management & Tissue Breakdown",
          questionText: "Aseptic dressing change protocol and prescribed dressings:",
          type: "text",
          answer: "Cleanse with sterile saline 0.9%, apply Aquacel Ag foam dressing and silicone adhesive border. Dressing change every Monday, Wednesday, Friday or PRN if strike-through occurs.",
        },
      ],
    },
    {
      id: "sec-diabetes-endocrine",
      title: "Diabetes Management & Endocrine Protocol",
      goal: "Ensure glycemic control, hypoglycemia rescue readiness, and insulin administration safety.",
      questions: [
        {
          id: "q-nur-diabetes",
          section: "Diabetes Management & Endocrine Protocol",
          questionText: "Diabetes type & insulin administration regimen:",
          type: "radio",
          options: [
            "Non-diabetic",
            "Type 2 Diabetes - Diet controlled / Oral Metformin",
            "Type 2 Diabetes - Subcutaneous insulin once daily (Lantus/Glargine)",
            "Type 1 / Brittle Diabetes - Multiple daily subcutaneous injections (Basal-Bolus) / CGM sensor",
          ],
          answer: "Type 2 Diabetes - Subcutaneous insulin once daily (Lantus/Glargine)",
        },
        {
          id: "q-nur-cbgfreq",
          section: "Diabetes Management & Endocrine Protocol",
          questionText: "Capillary blood glucose monitoring frequency:",
          type: "radio",
          options: [
            "Not required",
            "Twice weekly fasting check",
            "Daily pre-breakfast monitoring",
            "Four times daily (Before meals and before bed)",
          ],
          answer: "Daily pre-breakfast monitoring",
        },
      ],
    },
  ],
};
