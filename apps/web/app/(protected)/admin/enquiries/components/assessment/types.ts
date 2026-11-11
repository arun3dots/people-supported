import type { NeedsAssessmentDataDTO } from "@repo/schema";
export { type PresetTemplate, PRESET_ASSESSMENT_TEMPLATES } from "./presetTemplates";

export const DEFAULT_ASSESSMENT_FORM: NeedsAssessmentDataDTO = {
  dateOfAssessment: new Date().toISOString().split("T")[0],
  assessorName: "",
  prospectFullName: "",
  dob: "",
  currentLocation: "Home",
  assessmentReason: "New Enquiry",

  // Section 1
  mobilityStatus: "Fully independent (no equipment)",
  transferDependency: "Independent",
  fallHistory: "No",
  fallInjuriesNotes: "",

  // Section 2
  cognitiveDiagnoses: ["None"],
  orientationLevels: ["Time (Day/Night)", "Place (Where they are)", "Person (Recognise family)"],
  riskBehaviors: [],

  // Section 3
  dietTexture: "Normal/Standard Diet",
  swallowingChokingSafety: "No",
  fluidThickenersRequired: "No",
  eatingAssistanceLevel: "Independent",

  // Section 4
  bathingShoweringAssistance: "Independent",
  bladderContinence: "Fully Continent",
  bowelContinence: "Fully Continent",
  skinIntegrityRisk: "No",

  // Section 5
  medicationAdminCapacity: "Fully capable of self-administering medication (Requires room safe box)",
  specializedMedicalInterventions: [],

  // Section 6 — leave decision blank so clinician must explicitly choose
  finalAssessorDecision: undefined,
  recommendedCareAllocationLevel: "",
  recommendedRoomFeatures: "",
  assessorSignature: "",
  dateCompleted: "",

  customQuestions: [],
};
