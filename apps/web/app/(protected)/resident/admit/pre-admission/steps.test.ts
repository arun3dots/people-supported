import { describe, expect, it } from "vitest";
import {
  MandatoryPreAdmissionPartASchema,
  normalizePreAdmissionPartA,
  PRE_ADMISSION_ADL_ACTIVITIES,
  PreAdmissionPartDSchema,
  validateStepOnSave,
} from "@repo/schema";
import {
  PRE_ADMISSION_STEPS,
  PRE_ADMISSION_STEP_LABELS,
  STEP_PART,
  isReviewStep,
} from "./steps";

describe("PRE_ADMISSION_STEPS", () => {
  it("configures the onboarding steps without letter prefixes", () => {
    expect(PRE_ADMISSION_STEPS.map((s) => `${s.number}: ${s.title}`)).toEqual([
      "1: Admission and personal details",
      "2: About me",
      "3: Contacts and legal authority",
      "4: Health and medicines",
      "5: Risk assessment",
      "6: Care needs assessment",
      "7: Activities of Daily Living (ADLs)",
      "8: Capacity, consent, DoLS",
      "9: Advance care planning",
      "10: Room and belongings",
      "11: Review and decision",
    ]);
  });

  describe("normalizePreAdmissionPartA", () => {
    it("moves legacy care categories out of care level without inventing a level", () => {
      expect(
        normalizePreAdmissionPartA({
          careLevel: "Nursing",
        }),
      ).toMatchObject({
        typeOfCare: "Nursing Care",
        careLevel: null,
      });
    });

    it("normalizes enquiry categories and preserves current care levels", () => {
      expect(
        normalizePreAdmissionPartA({
          typeOfCare: "Mental Health",
          careLevel: "Medium",
        }),
      ).toMatchObject({
        typeOfCare: "Mental Health Care",
        careLevel: "Medium",
      });
    });
  });

  it("maps pre-admission JSON parts accurately and leaves steps 4, 5, and 11 null", () => {
    expect(STEP_PART).toEqual({
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
    });
  });

  it("defines matching compact stepper labels and marks step 11 as review", () => {
    expect(PRE_ADMISSION_STEP_LABELS[2]).toEqual({ line1: "About me" });
    expect(PRE_ADMISSION_STEP_LABELS[3]).toEqual({ line1: "Contacts" });
    expect(PRE_ADMISSION_STEP_LABELS[4]).toEqual({ line1: "Health" });
    expect(PRE_ADMISSION_STEP_LABELS[5]).toEqual({ line1: "Risk" });
    expect(PRE_ADMISSION_STEP_LABELS[6]).toEqual({ line1: "Assessment" });
    expect(PRE_ADMISSION_STEP_LABELS[7]).toEqual({ line1: "ADLs" });
    expect(PRE_ADMISSION_STEP_LABELS[11]).toEqual({ line1: "Review" });
    expect(isReviewStep(10)).toBe(false);
    expect(isReviewStep(11)).toBe(true);
  });

  it("validates risk and care needs at their reordered steps", () => {
    expect(validateStepOnSave(5, null, { riskAssessmentsCount: 0 }).success).toBe(false);
    expect(validateStepOnSave(5, null, { riskAssessmentsCount: 1 }).success).toBe(true);
    expect(validateStepOnSave(6, null, { hasAssessmentNeeds: false }).success).toBe(false);
    expect(validateStepOnSave(6, null, { hasAssessmentNeeds: true }).success).toBe(true);
  });

  it("requires a room and bed allocation before leaving step 10", () => {
    expect(validateStepOnSave(10, {}).success).toBe(false);
    expect(
      validateStepOnSave(10, { roomNumber: "101", bedId: null }).issues,
    ).toContainEqual({
      field: "bedId",
      message: "Bed allocation is required",
    });
    expect(
      validateStepOnSave(10, {
        roomNumber: "101",
        bedId: "bed-1",
        belongings: [],
        assistiveDevices: [],
      }).success,
    ).toBe(true);
  });

  it("accepts any recorded NHS number format at step 1", () => {
    const partA = {
      firstName: "Margaret",
      lastName: "Ellison",
      dob: "1942-03-14",
      gender: "Female",
      maritalStatus: "Widowed",
      nhsNumber: "1234567890",
      previousAddress: "1 High St",
      language: "English",
      stayType: "Permanent",
      typeOfCare: "Residential Care",
      careLevel: "Medium",
      admittedFrom: "Hospital",
      admissionReason: "Fall at home",
    };

    expect(() => MandatoryPreAdmissionPartASchema.parse(partA)).not.toThrow();
    expect(validateStepOnSave(1, partA).success).toBe(true);
    expect(
      MandatoryPreAdmissionPartASchema.safeParse({ ...partA, nhsNumber: "" })
        .success,
    ).toBe(false);
  });

  it("persists the ADL checklist in part D and validates it at step 7", () => {
    expect(PRE_ADMISSION_ADL_ACTIVITIES.map(({ label }) => label)).toEqual([
      "Bathing",
      "Grooming (hair care, shaving, etc.)",
      "Oral care",
      "Dressing",
      "Clothing upper body",
      "Clothing lower body",
      "Putting on/taking off shoes",
      "Feeding (does not include meal preparation)",
      "Feeding (using utensils)",
      "Drinking (using cups or glasses)",
      "Meal preparation",
      "Medication management",
    ]);

    const partD = PreAdmissionPartDSchema.parse({
      adlChecklist: {
        bathing: {
          assistanceLevel: "Partial assistance",
          comments: "Needs help washing lower legs",
        },
        medicationManagement: {
          assistanceLevel: "Supervision",
          comments: "Prompt to take medication",
        },
      },
      mobilityAids: ["Rollator"],
      fallsRiskLevel: "Medium",
    });

    expect(partD.adlChecklist.bathing).toEqual({
      assistanceLevel: "Partial assistance",
      comments: "Needs help washing lower legs",
    });
    expect(partD.adlChecklist.medicationManagement?.assistanceLevel).toBe(
      "Supervision",
    );
    expect(partD.mobilityAids).toEqual(["Rollator"]);
    expect(validateStepOnSave(7, partD).success).toBe(true);
  });
});
