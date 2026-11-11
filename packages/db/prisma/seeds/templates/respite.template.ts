import { TemplateDef } from "./types";

export const respiteTemplate: TemplateDef = {
  id: "demo-template-respite",
  name: "Short-Stay Respite & Reablement Assessment",
  category: "Respite",
  description: "Goal-oriented recovery assessment for temporary admissions, rehabilitation milestones, carer relief, and planned community discharge.",
  isDefault: false,
  sections: [
    {
      id: "sec-respite-profile",
      title: "Respite Admission Profile & Length of Stay",
      goal: "Define the purpose of stay, target duration, funding stream, and primary family contact.",
      questions: [
        {
          id: "q-resp-reason",
          section: "Respite Admission Profile & Length of Stay",
          questionText: "Primary reason for short-stay / respite admission:",
          type: "radio",
          options: [
            "Planned family / informal carer rest & holiday relief",
            "Emergency respite following main carer illness / hospitalisation",
            "Post-operative convalescence & rehabilitation following NHS hospital discharge",
            "Trial stay prior to permanent admission decision",
          ],
          answer: "Planned family / informal carer rest & holiday relief",
        },
        {
          id: "q-resp-duration",
          section: "Respite Admission Profile & Length of Stay",
          questionText: "Agreed duration of stay and expected discharge date:",
          type: "text",
          answer: "2-week planned stay. Target discharge date agreed with family and community care coordinator.",
        },
        {
          id: "q-resp-funding",
          section: "Respite Admission Profile & Length of Stay",
          questionText: "Funding and commissioning route:",
          type: "radio",
          options: [
            "Fully self-funded private respite",
            "Local Authority social services respite allocation",
            "NHS Discharge to Assess (D2A Pathway 2/3)",
            "Continuing Healthcare (CHC) fast-track convalescence",
          ],
          answer: "Fully self-funded private respite",
        },
      ],
    },
    {
      id: "sec-reablement-goals",
      title: "Rehabilitation Goals & Reablement Plan",
      goal: "Establish functional independence milestones to achieve during the temporary stay.",
      questions: [
        {
          id: "q-resp-goals",
          section: "Rehabilitation Goals & Reablement Plan",
          questionText: "Specific reablement goals targeted during stay:",
          type: "checkbox",
          options: [
            "Regain independent bed and chair transfers without staff aid",
            "Improve walking stamina with rollator from room to dining lounge",
            "Re-establish independent washing and dressing routine",
            "Re-learn safe self-administration of regular medications",
            "Rebuild confidence climbing domestic stairs",
          ],
          answer: [
            "Regain independent bed and chair transfers without staff aid",
            "Improve walking stamina with rollator from room to dining lounge",
          ],
        },
        {
          id: "q-resp-therapy",
          section: "Rehabilitation Goals & Reablement Plan",
          questionText: "Physiotherapy & Occupational Therapy input needed:",
          type: "radio",
          options: [
            "No formal therapy required",
            "Referral to community physiotherapist for gait rehabilitation exercises",
            "Occupational therapy review for home adaptations prior to discharge",
          ],
          answer: "Referral to community physiotherapist for gait rehabilitation exercises",
        },
      ],
    },
    {
      id: "sec-discharge-readiness",
      title: "Discharge Readiness & Home Environment Check",
      goal: "Ensure safe return to community living, home adaptations, and domiciliary care continuation.",
      questions: [
        {
          id: "q-resp-homeenv",
          section: "Discharge Readiness & Home Environment Check",
          questionText: "Home living situation and environmental safety at discharge address:",
          type: "checkbox",
          options: [
            "Lives alone in ground-floor flat/bungalow",
            "Lives alone in two-storey home with stairs",
            "Lives with supportive spouse or family member",
            "Key safe installed at front door (code verified)",
            "Domestic grab rails and raised toilet seat already in place",
          ],
          answer: ["Lives with supportive spouse or family member", "Key safe installed at front door (code verified)"],
        },
        {
          id: "q-resp-carepackage",
          section: "Discharge Readiness & Home Environment Check",
          questionText: "Post-discharge care package arrangement:",
          type: "radio",
          options: [
            "Family will resume primary care (no external agency)",
            "Existing domiciliary care package suspended during stay - to be restarted on discharge date",
            "Local authority social worker reassessment requested before discharge",
            "Home care agency 4x daily calls confirmed",
          ],
          answer: "Family will resume primary care (no external agency)",
        },
      ],
    },
  ],
};
