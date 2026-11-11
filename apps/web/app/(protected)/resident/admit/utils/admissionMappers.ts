import type {
  AdmissionFormData,
  DocumentChecklistItem,
  DocumentChecklistStatus,
  BelongingItem,
  CareProviderItem,
} from "../types";
import { DEFAULT_ADMISSION_FORM_DATA } from "../data/admissionFormFields";

export * from "./admissionPickers";

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string" || !value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

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

export function parseNameParts(fullName?: string) {
  if (!fullName) return { firstName: "", middleName: "", lastName: "" };
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] || "";
  const lastName = parts.length > 1 ? parts[parts.length - 1] || "" : "";
  const middleName = parts.length > 2 ? parts.slice(1, -1).join(" ") : "";
  return { firstName, middleName, lastName };
}

export function mapDraftToFormData(draft: any): AdmissionFormData {
  if (!draft) return DEFAULT_ADMISSION_FORM_DATA;

  const profile = draft.profile || {};
  const admission = draft.admission || {};
  const careProfile = draft.careProfile || {};
  const consent = draft.consent || {};
  const carePlans = Array.isArray(draft.carePlans) ? draft.carePlans : [];
  const primaryCarePlan = carePlans[0] || null;
  const observations = Array.isArray(draft.observations) ? draft.observations : [];
  const latestObs = observations[0] || null;

  // Names
  let firstName = profile.firstName || draft.firstName || "";
  const middleName = profile.middleName || "";
  let lastName = profile.lastName || draft.lastName || "";
  const fullName =
    draft.fullName ||
    [firstName, middleName, lastName].filter(Boolean).join(" ").trim() ||
    "";

  // Fallback: If firstName or lastName is missing but fullName is present (e.g. "John Vance")
  if ((!firstName || !lastName) && fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (!firstName && parts.length > 0) firstName = parts[0] || "";
    if (!lastName && parts.length > 1) lastName = parts.slice(1).join(" ") || "";
  }

  // Next of Kin
  const nokList = Array.isArray(draft.nextOfKin) ? draft.nextOfKin : [];
  const rawPrimaryNok = nokList[0] || {};
  const rawSecondaryNok = nokList[1] || {};

  const primaryNokParts = parseNameParts(rawPrimaryNok.name);
  const primaryContact = {
    firstName: rawPrimaryNok.firstName || primaryNokParts.firstName,
    middleName: rawPrimaryNok.middleName || primaryNokParts.middleName,
    lastName: rawPrimaryNok.lastName || primaryNokParts.lastName,
    name: rawPrimaryNok.name || DEFAULT_ADMISSION_FORM_DATA.primaryContact.name,
    relationship: rawPrimaryNok.relationship || DEFAULT_ADMISSION_FORM_DATA.primaryContact.relationship,
    phone: rawPrimaryNok.phone || DEFAULT_ADMISSION_FORM_DATA.primaryContact.phone,
    emailAddress: rawPrimaryNok.emailAddress || rawPrimaryNok.email || "",
  };

  const secondaryNokParts = parseNameParts(rawSecondaryNok.name);
  const secondaryContact = {
    firstName: rawSecondaryNok.firstName || secondaryNokParts.firstName,
    middleName: rawSecondaryNok.middleName || secondaryNokParts.middleName,
    lastName: rawSecondaryNok.lastName || secondaryNokParts.lastName,
    name: rawSecondaryNok.name || "",
    relationship: rawSecondaryNok.relationship || "Other",
    phone: rawSecondaryNok.phone || "",
    emailAddress: rawSecondaryNok.emailAddress || rawSecondaryNok.email || "",
  };

  // GP & Legal Rep
  const rawGp = draft.gpDetails || {};
  const gpDetails = {
    name: rawGp.name || rawGp.doctorName || careProfile.dentist || DEFAULT_ADMISSION_FORM_DATA.generalPractitioner.name,
    clinic: rawGp.clinic || rawGp.hospitalName || careProfile.hospitalName || "",
    phone: rawGp.phone || rawGp.doctorContact || careProfile.communityNursePhone || DEFAULT_ADMISSION_FORM_DATA.generalPractitioner.phone,
  };

  const generalConsent = consent.generalConsent || {};
  const legalRep = generalConsent.legalRep || {
    type: consent.poaDocumentUrl ? "POA" : "",
    nameContact: "",
    supportingDocumentUrl: consent.poaDocumentUrl || "",
  };

  // Other Providers
  const otherProviders: CareProviderItem[] = Array.isArray(careProfile.supportRequired) && careProfile.supportRequired.length > 0
    ? careProfile.supportRequired.map((str: string) => {
        const match = str.match(/^([^:]+):\s*([^(]+)(?:\((.*)\))?$/);
        if (match && match[1] && match[2]) {
          return {
            type: match[1].trim(),
            name: match[2].trim(),
            phone: match[3]?.trim() && match[3].trim() !== "N/A" ? match[3].trim() : "",
          };
        }
        return { type: "Other", name: str, phone: "" };
      })
    : DEFAULT_ADMISSION_FORM_DATA.otherProviders;

  // Belongings
  const rawBelongings = Array.isArray(draft.belongings) ? draft.belongings : [];
  const belongings: BelongingItem[] = rawBelongings.length > 0
    ? (rawBelongings as Record<string, unknown>[]).map((b) => ({
        item: String(b.item || ""),
        description: String(b.description || ""),
        conditionPhotoUrl: String(b.conditionPhotoUrl || ""),
        estValue: typeof b.estValue === "number" ? b.estValue : undefined,
      }))
    : DEFAULT_ADMISSION_FORM_DATA.belongings;

  // Documents
  const uploadedDocs = Array.isArray(draft.documents) ? (draft.documents as Record<string, unknown>[]) : [];
  const documents: DocumentChecklistItem[] = DEFAULT_ADMISSION_FORM_DATA.documents.map((defaultDoc) => {
    const matched = uploadedDocs.find(
      (d) => d.id === defaultDoc.id || String(d.name || "").toLowerCase() === defaultDoc.name.toLowerCase()
    );
    if (matched) {
      return {
        ...defaultDoc,
        status: (matched.status as DocumentChecklistStatus) || (matched.fileUrl ? "Uploaded" : "Missing"),
        fileUrl: (matched.fileUrl as string) || undefined,
        verifiedAt: matched.createdAt as string,
      };
    }
    return defaultDoc;
  });

  // Current Medications fallback from care plans if careProfile is empty
  let currentMedications = Array.isArray(careProfile.currentMedications) && careProfile.currentMedications.length > 0
    ? careProfile.currentMedications
    : null;
  if (!currentMedications && primaryCarePlan && Array.isArray(primaryCarePlan.medications) && primaryCarePlan.medications.length > 0) {
    currentMedications = (primaryCarePlan.medications as Record<string, unknown>[]).map((m) => ({
      name: String(m.name || ""),
      dose: String(m.dosage || m.dose || ""),
      frequency: String(m.frequency || "Once Daily"),
      route: String(m.route || "Oral"),
      prescribingDoctor: String(m.prescriber || ""),
    }));
  }
  if (!currentMedications) {
    currentMedications = DEFAULT_ADMISSION_FORM_DATA.currentMedications;
  }

  // Baseline Vitals fallback from latest observation
  const baselineVitalsData = careProfile.baselineVitals || (latestObs ? {
    bp: latestObs.bloodPressureSystolic && latestObs.bloodPressureDiastolic ? `${latestObs.bloodPressureSystolic}/${latestObs.bloodPressureDiastolic}` : undefined,
    pulse: latestObs.heartRate,
    temp: latestObs.temperature,
    respiratoryRate: latestObs.respiratoryRate,
    spO2: latestObs.oxygenSaturation,
  } : DEFAULT_ADMISSION_FORM_DATA.baselineVitals);
  const baselineVitals = {
    bp: baselineVitalsData.bp || "",
    pulse: toOptionalNumber(baselineVitalsData.pulse),
    temp: toOptionalNumber(baselineVitalsData.temp),
    respiratoryRate: toOptionalNumber(baselineVitalsData.respiratoryRate),
    spO2: toOptionalNumber(baselineVitalsData.spO2),
  };

  return {
    ...DEFAULT_ADMISSION_FORM_DATA,

    // Step 1
    photoUrl: draft.photoUrl || profile.profilePhotoUrl || "",
    firstName,
    middleName,
    lastName,
    fullName,
    preferredName: profile.preferredName || "",
    dob: formatDateForInput(draft.dob || profile.dob),
    gender: profile.gender || draft.gender || "Female",
    maritalStatus: profile.maritalStatus || "Single",
    nhsNumber: draft.nhsNumber || profile.nationalId || "",
    nationalId: profile.nationalId || draft.nhsNumber || "",
    nationalIdType: profile.nationalIdType || "Passport / National ID",
    religion: profile.religion || "",
    languagesSpoken: Array.isArray(profile.languagesSpoken) && profile.languagesSpoken.length > 0
      ? profile.languagesSpoken
      : [],
    interpreterRequired: profile.interpreterRequired ?? false,
    formerOccupation: profile.formerOccupation || "",
    hobbies: profile.hobbies || "",
    previousAddress: profile.addressLine1 || "",
    admissionDate: formatDateForInput(draft.admissionDate || admission.expectedAdmissionDate),
    admissionType: admission.admissionType || "Permanent",
    admittedFrom: admission.admittedFrom || "Home",
    referringFacilityName: admission.referringFacilityName || "",

    // Step 2
    primaryContact,
    secondaryContact,
    responsibleParty: {
      firstName: admission.billingResponsibleParty?.firstName || parseNameParts(admission.billingResponsibleParty?.name).firstName,
      middleName: admission.billingResponsibleParty?.middleName || parseNameParts(admission.billingResponsibleParty?.name).middleName,
      lastName: admission.billingResponsibleParty?.lastName || parseNameParts(admission.billingResponsibleParty?.name).lastName,
      name: admission.billingResponsibleParty?.name || DEFAULT_ADMISSION_FORM_DATA.responsibleParty.name,
      relationship: admission.billingResponsibleParty?.relationship || DEFAULT_ADMISSION_FORM_DATA.responsibleParty.relationship,
      phone: admission.billingResponsibleParty?.phone || DEFAULT_ADMISSION_FORM_DATA.responsibleParty.phone,
      address: admission.billingResponsibleParty?.address || "",
    },
    legalRep,
    generalPractitioner: gpDetails,
    otherProviders,

    // Step 3
    primaryDiagnosis: careProfile.primaryDiagnosis || primaryCarePlan?.diagnosis || primaryCarePlan?.title || "",
    secondaryDiagnoses: careProfile.secondaryDiagnoses || [],
    heightCm: careProfile.heightCm || undefined,
    weightKg: careProfile.weightKg || undefined,
    bmi: careProfile.bmi || undefined,
    baselineVitals,
    medicationAllergies: careProfile.medicationAllergies || [],
    foodAllergies: careProfile.foodAllergies || [],
    environmentalAllergies: careProfile.environmentalAllergies || [],
    currentMedications,
    chronicConditions: careProfile.chronicConditions || [],
    pastSurgeries: careProfile.postSurgeries || "",
    immunizationHistory: typeof careProfile.immunisationStatus === "string" ? careProfile.immunisationStatus : "",
    skinConditionPressureAreas: careProfile.skinConditionPressureAreas || "",
    continenceStatus: careProfile.continenceStatus || careProfile.continence || "Fully Continent",
    sensoryAids: Array.isArray(careProfile.sensoryAids)
      ? careProfile.sensoryAids.join(", ")
      : careProfile.sensoryAids || "",
    dentalStatus: careProfile.dentalStatus || "Natural Teeth (Good)",
    substanceUseHistory: careProfile.substanceUseHistory || "",
    recentHospitalizations: careProfile.recentHospitalizations || "",

    // Step 4
    adlKatzMatrix: careProfile.adlKatzMatrix || DEFAULT_ADMISSION_FORM_DATA.adlKatzMatrix,
    adlScore: typeof careProfile.adlScore === "number" ? careProfile.adlScore : 6,
    mobilityAidsUsed: careProfile.mobilityAidsUsed || [],
    fallRiskScore: careProfile.fallRiskScore || "",
    fallsLast6Months: careProfile.fallsLast6Months || "",
    ambulationDistance: careProfile.ambulationDistance || "",
    cognitiveScore: careProfile.cognitiveScore || "",
    orientation: careProfile.orientation || "",
    communicationAbility: careProfile.communicationAbility || "",
    behavioralConcerns: careProfile.behavioralConcerns || "",
    sleepPattern: careProfile.sleepPattern || "",
    dietType: careProfile.dietType || primaryCarePlan?.dietType || "",
    textureModification: careProfile.textureModification || "",
    feedingAssistanceNeed: careProfile.feedingAssistanceNeed || "",
    familyInvolvement: careProfile.familyInvolvement || "",
    routinePreferences: careProfile.routinePreferences || "",

    // Step 5
    consentChecklist: Array.isArray(consent.consentChecklist) && consent.consentChecklist.length > 0
      ? consent.consentChecklist
      : DEFAULT_ADMISSION_FORM_DATA.consentChecklist,
    advanceDirectives: consent.advanceDirectives || {
      livingWillOnFile: "No",
      dnarStatus: draft.dnarStatus ? "DNR" : "Not yet discussed",
      healthcareProxyNamed: "",
    },
    poaDocumentUrl: consent.poaDocumentUrl || "",
    guardianshipOrderUrl: consent.guardianshipOrderUrl || "",
    insuranceAssignmentStatus: consent.insuranceAssignmentStatus || "Signed",

    // Step 6
    primaryPaymentMethod: admission.primaryPaymentMethod || draft.fundingType || "Private Pay (Self-Funded)",
    secondaryCoverage: admission.secondaryCoverage || "",
    insuranceProvider: profile.insuranceProvider || "",
    insurancePolicyNumber: admission.insurancePolicyNumber || "",
    benefitId: admission.benefitId || "",
    billingResponsibleParty: {
      name: admission.billingResponsibleParty?.name || "",
      relationship: admission.billingResponsibleParty?.relationship || "Self",
      phone: admission.billingResponsibleParty?.phone || "",
      address: admission.billingResponsibleParty?.address || "",
    },
    agreedRoomRate: admission.agreedRoomRate || 0,
    agreedRoomRatePeriod: admission.agreedRoomRatePeriod || "Month",
    depositAmount: admission.depositAmount || 0,
    depositDate: formatDateForInput(admission.depositDate),
    paymentSchedule: admission.paymentSchedule || "Monthly",
    directDebitDetails: admission.directDebitDetails || "",
    financialPoaDocUrl: admission.financialPoaDocUrl || "",

    // Step 7
    assignedBedId: admission.assignedBedId || draft.bed?.id || "",
    roomNumber: draft.bed?.room?.roomNumber || draft.roomNumber || "",
    roomType: admission.roomTypePreference || draft.roomType || "",
    moveInDateTime: admission.moveInDateTime
      ? new Date(admission.moveInDateTime).toISOString().slice(0, 16)
      : "",
    roommate: admission.roommateId || "",
    belongings,
    liabilityWaiverSigned: admission.liabilityWaiverSigned ?? false,
    assistiveDevices: admission.assistiveDevices || [],
    valuablesInSafe: admission.valuablesInSafe ?? false,
    valuablesDescription: admission.valuablesDescription || "",

    // Step 8
    documents,

    // Step 9
    staffDeclarationSigned: false,
    admittingStaffName: admission.admittingStaffName || "",
    confirmationDateTime: new Date().toISOString().slice(0, 16),
  };
}
