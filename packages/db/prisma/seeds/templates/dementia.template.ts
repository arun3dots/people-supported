import { TemplateDef } from "./types";

export const dementiaTemplate: TemplateDef = {
  id: "demo-template-dementia",
  name: "Dementia, Cognitive & Behavioural Support Assessment",
  category: "Dementia",
  description: "Specialist memory care assessment covering orientation, BPSD distress triggers, wander risk, and non-pharmacological de-escalation.",
  isDefault: false,
  sections: [
    {
      id: "sec-cog-orientation",
      title: "Cognitive Profile & Orientation",
      goal: "Identify degree of cognitive impairment, lucidity patterns, and reality orientation.",
      questions: [
        {
          id: "q-dem-stage",
          section: "Cognitive Profile & Orientation",
          questionText: "Primary cognitive diagnosis & clinical stage:",
          type: "radio",
          options: [
            "Early-stage Alzheimer's / Mild Cognitive Impairment",
            "Moderate Vascular Dementia (step-wise decline)",
            "Lewy Body / Parkinson's Dementia (visual hallucinations present)",
            "Frontotemporal Dementia (behavioural variant)",
            "Severe / Advanced cognitive impairment",
          ],
          answer: "Moderate Vascular Dementia (step-wise decline)",
        },
        {
          id: "q-dem-orientation",
          section: "Cognitive Profile & Orientation",
          questionText: "Orientation parameters (Time, Place, Person):",
          type: "checkbox",
          options: [
            "Oriented to time/day",
            "Oriented to surroundings/room location",
            "Recognises immediate family members",
            "Recognises care staff",
            "Severe disorientation across all domains",
          ],
          answer: ["Oriented to surroundings/room location", "Recognises immediate family members"],
        },
      ],
    },
    {
      id: "sec-safe-exit",
      title: "Safe Environment & Wander Risk",
      goal: "Evaluate wander patterns, exit-seeking behavior, and necessity of secure memory ward perimeter.",
      questions: [
        {
          id: "q-dem-wandering",
          section: "Safe Environment & Wander Risk",
          questionText: "Pacing, wandering & exit-seeking frequency:",
          type: "radio",
          options: [
            "Never attempts unescorted exit",
            "Purposeless daytime wandering within communal lounges/gardens",
            "Active exit-seeking when doors open (attempts to 'go home / go to work')",
            "High-risk elopement history (requires continuous 1:1 supervision or secure keypad unit)",
          ],
          answer: "Active exit-seeking when doors open (attempts to 'go home / go to work')",
        },
        {
          id: "q-dem-nightwake",
          section: "Safe Environment & Wander Risk",
          questionText: "Night-time waking & sleep-wake cycle disruption:",
          type: "radio",
          options: [
            "Sleeps soundly 7-8 hours",
            "Wakes occasionally, settles with warm drink / gentle reassurance",
            "Sundowning agitation (late afternoon restlessness & distress)",
            "Complete sleep inversion (awake and active throughout night)",
          ],
          answer: "Sundowning agitation (late afternoon restlessness & distress)",
        },
      ],
    },
    {
      id: "sec-triggers-pbs",
      title: "Distress Triggers & Positive Behaviour Support (PBS)",
      goal: "Map behavioral triggers and establish non-restrictive calming strategies.",
      questions: [
        {
          id: "q-dem-triggers",
          section: "Distress Triggers & Positive Behaviour Support (PBS)",
          questionText: "Identified behavioural triggers causing anxiety or agitation:",
          type: "checkbox",
          options: [
            "Loud, sudden environmental noise / sensory overload",
            "Intimate personal care (resistance to washing/undressing)",
            "Crowded dining areas / mealtime overstimulation",
            "Unfamiliar staff faces / rapid changes in routine",
            "Physical discomfort, pain, or constipation",
          ],
          answer: ["Intimate personal care (resistance to washing/undressing)", "Unfamiliar staff faces / rapid changes in routine"],
        },
        {
          id: "q-dem-calming",
          section: "Distress Triggers & Positive Behaviour Support (PBS)",
          questionText: "Proven non-pharmacological calming & de-escalation techniques:",
          type: "text",
          answer: "Offer chamomile tea, play 1950s big band music, walk together in the sensory courtyard garden, engage with tactile memory scrapbooks, gently validate feelings without direct confrontation.",
        },
        {
          id: "q-dem-resistance",
          section: "Distress Triggers & Positive Behaviour Support (PBS)",
          questionText: "Resistance or defensive behavior during care:",
          type: "radio",
          options: [
            "Never aggressive",
            "Verbal resistance / shouting when startled",
            "Physical pushing away during intimate hygiene",
            "High-frequency physical agitation requiring two-carer person-centred approach",
          ],
          answer: "Verbal resistance / shouting when startled",
        },
      ],
    },
  ],
};
