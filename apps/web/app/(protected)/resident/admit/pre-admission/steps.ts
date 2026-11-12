import type { PreAdmissionPartKey } from "@repo/schema";
import type { AdmissionStep, AdmissionStepMeta } from "../types";

export const PRE_ADMISSION_STEPS: AdmissionStepMeta[] = [
  { number: 1, title: "Admission and personal details", shortTitle: "Admission", description: "Who they are and why they are moving in" },
  { number: 2, title: "About me", shortTitle: "About me", description: "Likes, routine and what matters" },
  { number: 3, title: "Contacts and legal authority", shortTitle: "Contacts", description: "Next of kin, LPA and professionals" },
  { number: 4, title: "Health and medicines", shortTitle: "Health", description: "Diagnoses, allergies and medicines" },
  { number: 5, title: "Risk assessment", shortTitle: "Risk", description: "Clinical risk assessments & safety tools" },
  { number: 6, title: "Care needs assessment", shortTitle: "Assessment", description: "Areas of need, support levels and care plans" },
  { number: 7, title: "Activities of Daily Living (ADLs)", shortTitle: "ADLs", description: "Functional independence, mobility and daily living support" },
  { number: 8, title: "Capacity, consent, DoLS", shortTitle: "Capacity", description: "Capacity, consents and DoLS screen" },
  { number: 9, title: "Advance care planning", shortTitle: "Advance care", description: "DNACPR, ReSPECT and future plans" },
  { number: 10, title: "Room and belongings", shortTitle: "Room", description: "Property, room, belongings and devices" },
  { number: 11, title: "Review and decision", shortTitle: "Review", description: "Check, submit and manager decision" },
];

export const PRE_ADMISSION_STEP_LABELS: Record<number, { line1: string; line2?: string }> = {
  1: { line1: "Personal Details" },
  2: { line1: "About me" },
  3: { line1: "Contacts" },
  4: { line1: "Health" },
  5: { line1: "Risk" },
  6: { line1: "Assessment" },
  7: { line1: "ADLs" },
  8: { line1: "Capacity" },
  9: { line1: "Advance care" },
  10: { line1: "Room", line2: "Belongings" },
  11: { line1: "Review" },
};

/** Step number to the pre-admission part it edits; steps 5, 6, and 11 use dedicated workflows. */
export const STEP_PART: Record<number, PreAdmissionPartKey | null> = {
  1: "partA",
  2: "partG",
  3: "partB",
  4: "partC",
  5: null,
  6: null,
  7: "partD",
  8: "partE",
  9: "partF",
  10: "roomAllocation",
  11: null,
};

export const isReviewStep = (step: AdmissionStep) => step === 11;
