import type { EnquiryResponseDTO } from "@repo/schema";
import type { AdmissionFormData, ADLKatzLevel } from "../types";
import { DEFAULT_ADMISSION_FORM_DATA } from "../data/admissionFormFields";

function formatDateForInput(dateVal?: string | Date | null): string {
  if (!dateVal) return "";
  try {
    const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
    if (isNaN(d.getTime())) return typeof dateVal === "string" ? dateVal : "";
    return d.toISOString().split("T")[0] || "";
  } catch {
    return "";
  }
}

function mapAssistanceLevel(val?: string | null): ADLKatzLevel {
  if (!val) return "Independent";
  const lower = val.toLowerCase();
  if (lower.includes("total") || lower.includes("dependent")) return "Total Dependence";
  if (lower.includes("extensive")) return "Extensive Assist";
  if (
    lower.includes("limit") ||
    lower.includes("needs 1") ||
    lower.includes("one carer") ||
    lower.includes("assistance")
  ) {
    return "Limited Assist";
  }
  if (lower.includes("supervis") || lower.includes("prompt")) return "Supervision";
  return "Independent";
}

/**
 * Transforms an EnquiryResponseDTO (including pre-admission assessment data)
 * into a pre-filled AdmissionFormData object ready for the 9-step wizard.
 */
export function mapEnquiryToFormData(enquiry: EnquiryResponseDTO): AdmissionFormData {
  const base = { ...DEFAULT_ADMISSION_FORM_DATA };
  const ad = enquiry.assessmentData;

  const firstName = enquiry.firstName || "";
  const middleName = enquiry.middleName || "";
  const lastName = enquiry.lastName || "";
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ").trim();

  // 1. Personal
  const admissionDate =
    formatDateForInput(enquiry.targetAdmissionDate) ||
    formatDateForInput(new Date());

  // 2. Contacts / Next of Kin
  const primaryContact = {
    name: enquiry.enquirerName || base.primaryContact.name,
    relationship: enquiry.enquirerRelationship || base.primaryContact.relationship,
    phone: enquiry.enquirerPhone || base.primaryContact.phone,
    emailAddress: enquiry.enquirerEmail || "",
  };

  const responsibleParty = {
    name: enquiry.enquirerName || base.responsibleParty.name,
    relationship: enquiry.enquirerRelationship || base.responsibleParty.relationship,
    phone: enquiry.enquirerPhone || base.responsibleParty.phone,
    address: "",
  };

  const billingResponsibleParty = {
    name: enquiry.enquirerName || "",
    relationship: enquiry.enquirerRelationship || "",
    phone: enquiry.enquirerPhone || "",
    address: "",
  };

  // 3. Medical & Diagnoses
  const primaryDiagnosis =
    enquiry.medicalNeeds ||
    (enquiry.careCategory ? `${enquiry.careCategory} Care` : "");
  const secondaryDiagnoses =
    ad?.cognitiveDiagnoses && Array.isArray(ad.cognitiveDiagnoses)
      ? ad.cognitiveDiagnoses
      : [];
  const chronicConditions = enquiry.medicalNeeds ? [enquiry.medicalNeeds] : [];
  const foodAllergies = enquiry.dietaryRequirements
    ? [enquiry.dietaryRequirements]
    : [];

  // 4. ADL Matrix mapping
  const adlKatzMatrix = { ...base.adlKatzMatrix };
  if (ad) {
    if (ad.bathingShoweringAssistance) {
      adlKatzMatrix.bathing = mapAssistanceLevel(ad.bathingShoweringAssistance);
    }
    if (ad.transferDependency || ad.mobilityStatus) {
      adlKatzMatrix.transferring = mapAssistanceLevel(
        ad.transferDependency || ad.mobilityStatus
      );
    }
    if (ad.eatingAssistanceLevel) {
      adlKatzMatrix.eating = mapAssistanceLevel(ad.eatingAssistanceLevel);
    }
    if (ad.bladderContinence === "Incontinent") {
      adlKatzMatrix.continence = "Total Dependence";
    } else if (ad.bladderContinence === "Occasionally Incontinent") {
      adlKatzMatrix.continence = "Limited Assist";
    }
    if (
      ad.bowelContinence === "Incontinent" ||
      ad.bladderContinence === "Incontinent"
    ) {
      adlKatzMatrix.toileting = "Limited Assist";
    }
  }

  // 5. Room Preference
  const roomType = enquiry.preferredRoomType || base.roomType;

  return {
    ...base,
    // Step 1
    firstName,
    middleName,
    lastName,
    fullName,
    dob: formatDateForInput(enquiry.dob),
    admittedFrom: enquiry.currentLocation || base.admittedFrom,
    admissionType: enquiry.careCategory || base.admissionType,
    admissionDate,

    // Step 2
    primaryContact,
    responsibleParty,
    billingResponsibleParty,

    // Step 3
    primaryDiagnosis,
    secondaryDiagnoses,
    chronicConditions,
    foodAllergies,
    continenceStatus:
      ad?.bladderContinence || ad?.bowelContinence || base.continenceStatus,

    // Step 4
    adlKatzMatrix,
    dietType: ad?.dietTexture || base.dietType,
    feedingAssistanceNeed:
      ad?.eatingAssistanceLevel || base.feedingAssistanceNeed,
    fallRiskScore: ad?.fallHistory === "Yes" ? "High" : base.fallRiskScore,
    fallsLast6Months: ad?.fallInjuriesNotes || "",
    behavioralConcerns:
      ad?.riskBehaviors && Array.isArray(ad.riskBehaviors)
        ? ad.riskBehaviors.join(", ")
        : "",

    // Step 7
    roomType,
  };
}

