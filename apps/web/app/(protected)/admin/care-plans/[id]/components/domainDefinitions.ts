import React from "react";
import {
  User,
  MessageSquare,
  Activity,
  Utensils,
  Droplets,
  Pill,
  Brain,
  Heart,
  FileCheck2,
} from "lucide-react";

export interface DomainDef {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  cqcKLOE: string;
  placeholder: string;
}

export const DOMAINS: DomainDef[] = [
  {
    key: "pen_portrait",
    title: "1. Pen Portrait (About Me)",
    subtitle: "Life history, personality, daily rhythms, and what makes a good day",
    icon: User,
    cqcKLOE: "CQC Responsive (R1)",
    placeholder: "Document early life, career, proudest moments, family connections, and preferred wake/sleep routine...",
  },
  {
    key: "communication",
    title: "2. Communication Passport",
    subtitle: "Sensory needs, non-verbal cues, and effective engagement strategies",
    icon: MessageSquare,
    cqcKLOE: "CQC Caring & Responsive",
    placeholder: "Detail hearing/vision aids, native language, cues for distress/comfort, and three-column response guidelines...",
  },
  {
    key: "mobility",
    title: "3. Mobility & Falls Prevention",
    subtitle: "Transfers, equipment needed, weight-bearing ability, and environmental safety",
    icon: Activity,
    cqcKLOE: "CQC Safe (S2)",
    placeholder: "Transfer technique (e.g. 1-carer assist, frame), footwear preferences, bed-rail checks, and night-time mobility...",
  },
  {
    key: "nutrition",
    title: "4. Nutrition, Hydration & Diet",
    subtitle: "Dietary textures (IDDSI), food preferences, likes/dislikes, and fluid targets",
    icon: Utensils,
    cqcKLOE: "CQC Effective & Safe",
    placeholder: "Special diets (pureed, soft, diabetic), favorite meals/snacks, fluid targets (e.g. 1,800ml/day), and seating needs...",
  },
  {
    key: "continence",
    title: "5. Continence & Personal Care",
    subtitle: "Hygiene routines, bathing preferences, skin integrity, and dignity support",
    icon: Droplets,
    cqcKLOE: "CQC Caring & Safe",
    placeholder: "Preferred bath/shower times, products used, continence aids, prompting schedules, and privacy considerations...",
  },
  {
    key: "medication",
    title: "6. Medication & Pain Management",
    subtitle: "Administration preferences, pain assessment tools (Abbey), and PRN protocols",
    icon: Pill,
    cqcKLOE: "CQC Safe & Effective",
    placeholder: "Swallowing ability for tablets, time preferences, observable signs of pain, and non-pharmacological comfort measures...",
  },
  {
    key: "mental_health",
    title: "7. Mental Health, Cognition & Wellbeing",
    subtitle: "Cognitive support, orientation, distress triggers, and calming strategies",
    icon: Brain,
    cqcKLOE: "CQC Responsive & Safe",
    placeholder: "Signs of anxiety or sundowning, effective distraction techniques, validation approaches, and memory cues...",
  },
  {
    key: "social",
    title: "8. Social, Cultural & Spiritual Life",
    subtitle: "Meaningful hobbies, cultural observances, community connections, and faith",
    icon: Heart,
    cqcKLOE: "CQC Caring & Responsive",
    placeholder: "Religious services, preferred radio/music, hobbies (gardening, reading), visitor preferences, and celebrations...",
  },
  {
    key: "end_of_life",
    title: "9. Advance Care Planning & End of Life",
    subtitle: "ReSPECT summary, DNACPR status, spiritual wishes, and family notification",
    icon: FileCheck2,
    cqcKLOE: "CQC Responsive (R3)",
    placeholder: "Document Advance Decision to Refuse Treatment (ADRT), ReSPECT priorities, LPA for Health & Welfare, and comfort wishes...",
  },
];
