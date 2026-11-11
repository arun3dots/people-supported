import { describe, it, expect } from "vitest";
import type { EnquiryResponseDTO } from "@repo/schema";
import { mapEnquiryToFormData } from "./mapEnquiryToFormData";

describe("mapEnquiryToFormData", () => {
  const mockMinimalEnquiry: EnquiryResponseDTO = {
    id: "enq-12345",
    tenantId: "tenant-1",
    enquirerName: "Jane Doe",
    enquirerRelationship: "Daughter",
    enquirerPhone: "07123456789",
    enquirerEmail: "jane.doe@example.com",
    firstName: "John",
    lastName: "Doe",
    dob: "1945-05-12T00:00:00.000Z",
    currentLocation: "Home",
    careCategory: "Dementia",
    status: "Ready for Admission",
    medicalNeeds: "Moderate Alzheimer's and hypertension",
    dependencyLevel: "Medium",
    mobilityNeeds: "Uses walking stick",
    dietaryRequirements: "Soft food only",
    riskNotes: "Prone to evening wandering",
    assessmentData: null,
    assessmentCompletedAt: null,
    targetAdmissionDate: new Date("2026-10-01T00:00:00.000Z"),
    preferredRoomType: "Single Ensuite",
    notes: "Requires ground floor accommodation",
    convertedResidentId: null,
    admittedAt: null,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-02T12:00:00.000Z",
  };

  it("correctly maps minimal enquiry data without pre-admission assessment", () => {
    const formData = mapEnquiryToFormData(mockMinimalEnquiry);

    // Step 1: Personal
    expect(formData.firstName).toBe("John");
    expect(formData.lastName).toBe("Doe");
    expect(formData.fullName).toBe("John Doe");
    expect(formData.dob).toBe("1945-05-12");
    expect(formData.admittedFrom).toBe("Home");
    expect(formData.admissionType).toBe("Dementia");
    expect(formData.admissionDate).toBe("2026-10-01");

    // Step 2: Contacts
    expect(formData.primaryContact.name).toBe("Jane Doe");
    expect(formData.primaryContact.relationship).toBe("Daughter");
    expect(formData.primaryContact.phone).toBe("07123456789");
    expect(formData.primaryContact.emailAddress).toBe("jane.doe@example.com");

    expect(formData.responsibleParty.name).toBe("Jane Doe");
    expect(formData.responsibleParty.relationship).toBe("Daughter");
    expect(formData.responsibleParty.phone).toBe("07123456789");

    // Step 3: Medical
    expect(formData.primaryDiagnosis).toBe("Moderate Alzheimer's and hypertension");
    expect(formData.chronicConditions).toContain("Moderate Alzheimer's and hypertension");
    expect(formData.foodAllergies).toContain("Soft food only");

    // Step 7: Room
    expect(formData.roomType).toBe("Single Ensuite");
  });

  it("correctly maps rich pre-admission assessment data when present", () => {
    const enquiryWithAssessment: EnquiryResponseDTO = {
      ...mockMinimalEnquiry,
      assessmentData: {
        dateOfAssessment: "2026-09-03",
        assessorName: "Nurse Nancy",
        prospectFullName: "John Doe",
        dob: "1945-05-12",
        currentLocation: "Home",
        cognitiveDiagnoses: ["Vascular Dementia", "Type 2 Diabetes"],
        bathingShoweringAssistance: "Needs 1 carer assistance",
        mobilityStatus: "Extensive assistance needed with frame",
        transferDependency: "Extensive Assist",
        eatingAssistanceLevel: "Prompting and set up needed",
        bladderContinence: "Occasionally Incontinent",
        bowelContinence: "Continent",
        dietTexture: "Pureed",
        fallHistory: "Yes",
        fallInjuriesNotes: "2 falls at home without fracture",
        riskBehaviors: ["Wandering", "Agitation"],
      },
    };

    const formData = mapEnquiryToFormData(enquiryWithAssessment);

    // ADL Katz Matrix
    expect(formData.adlKatzMatrix.bathing).toBe("Limited Assist");
    expect(formData.adlKatzMatrix.transferring).toBe("Extensive Assist");
    expect(formData.adlKatzMatrix.eating).toBe("Supervision");
    expect(formData.adlKatzMatrix.continence).toBe("Limited Assist");

    // Clinical / Cognitive
    expect(formData.secondaryDiagnoses).toEqual(["Vascular Dementia", "Type 2 Diabetes"]);
    expect(formData.dietType).toBe("Pureed");
    expect(formData.feedingAssistanceNeed).toBe("Prompting and set up needed");
    expect(formData.fallRiskScore).toBe("High");
    expect(formData.fallsLast6Months).toBe("2 falls at home without fracture");
    expect(formData.behavioralConcerns).toBe("Wandering, Agitation");
  });

  it("handles empty fields and fallback defaults gracefully", () => {
    const blankEnquiry: EnquiryResponseDTO = {
      id: "enq-empty",
      tenantId: "tenant-1",
      enquirerName: "",
      enquirerRelationship: "",
      enquirerPhone: "",
      enquirerEmail: null,
      firstName: "",
      lastName: "",
      dob: null,
      currentLocation: "",
      careCategory: "",
      status: "Open",
      medicalNeeds: null,
      dependencyLevel: null,
      mobilityNeeds: null,
      dietaryRequirements: null,
      riskNotes: null,
      assessmentData: null,
      assessmentCompletedAt: null,
      targetAdmissionDate: null,
      preferredRoomType: null,
      notes: null,
      convertedResidentId: null,
      admittedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const formData = mapEnquiryToFormData(blankEnquiry);
    expect(formData.firstName).toBe("");
    expect(formData.lastName).toBe("");
    expect(formData.fullName).toBe("");
    expect(formData.primaryContact.name).toBe("");
    expect(formData.primaryDiagnosis).toBe("");
    expect(formData.adlKatzMatrix.bathing).toBe("Independent");
  });
});

