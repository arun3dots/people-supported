import type { AssessmentCustomQuestionDTO } from "@repo/schema";

export interface PresetTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  isDefault: boolean;
  questions: AssessmentCustomQuestionDTO[];
}

export const PRESET_ASSESSMENT_TEMPLATES: PresetTemplate[] = [
  {
    id: "preset-standard",
    name: "Standard Pre-Admission Comprehensive Template",
    category: "Pre-Admission",
    description: "Standard 6-section CQC-aligned pre-admission clinical fit assessment.",
    isDefault: true,
    questions: [
      {
        id: "q-sleep",
        section: "Daily Living & Night Care",
        questionText: "Does the prospect have regular sleep disruption or wander at night?",
        type: "radio" as const,
        options: [
          "Slept soundly throughout night",
          "Wakes 1-2 times with gentle settling",
          "Frequent night wakefulness / wandering",
        ],
        answer: "Slept soundly throughout night",
      },
      {
        id: "q-sensory",
        section: "Sensory & Communication",
        questionText: "Sensory impairments or communication aids required:",
        type: "checkbox" as const,
        options: [
          "Hearing Aid (Left/Right)",
          "Glasses / Vision Impairment",
          "Dentures (Upper/Lower)",
          "Speech Impairment / Uses Picture Cards",
          "None",
        ],
        answer: ["None"],
      },
      {
        id: "q-hobbies",
        section: "Social & Lifestyle",
        questionText: "Key hobbies, background interests, and daily routine preferences:",
        type: "text" as const,
        answer: "",
      },
    ],
  },
  {
    id: "preset-dementia",
    name: "Dementia & Memory Care Specialist Assessment",
    category: "Dementia",
    description: "Specialised assessment for secure memory care, sun-downing, and behavioural support.",
    isDefault: false,
    questions: [
      {
        id: "q-wandering",
        section: "Secure Unit Compatibility",
        questionText: "Frequency of exit-seeking or elopement attempts:",
        type: "radio" as const,
        options: [
          "Never",
          "Occasional if door open",
          "Frequent / High Risk - Requires locked keypad environment",
        ],
        answer: "Occasional if door open",
      },
      {
        id: "q-triggers",
        section: "Behavioural De-escalation",
        questionText: "Known calming techniques and behavioural triggers:",
        type: "text" as const,
        answer: "",
      },
    ],
  },
  {
    id: "preset-respite",
    name: "Short-Stay / Respite Care Fast-Track Assessment",
    category: "Respite",
    description: "Streamlined assessment for planned convalescence or short respite admissions.",
    isDefault: false,
    questions: [
      {
        id: "q-respite-duration",
        section: "Stay Parameters",
        questionText: "Anticipated duration of respite stay (weeks / dates):",
        type: "text" as const,
        answer: "2 Weeks",
      },
      {
        id: "q-discharge-plan",
        section: "Discharge & Return Home Plan",
        questionText: "Is there a confirmed home care package arranged for discharge?",
        type: "radio" as const,
        options: [
          "Yes, package active",
          "Family will resume primary care",
          "Awaiting local authority review",
        ],
        answer: "Family will resume primary care",
      },
    ],
  },
];

