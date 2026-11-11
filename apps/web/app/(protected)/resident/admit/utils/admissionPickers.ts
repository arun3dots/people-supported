import type { AdmissionFormData } from "../types";

export function pickStep1(v: AdmissionFormData) {
  return {
    firstName: v.firstName,
    middleName: v.middleName,
    lastName: v.lastName,
    fullName: v.fullName,
    preferredName: v.preferredName,
    dob: v.dob,
    gender: v.gender,
    maritalStatus: v.maritalStatus,
    nationalId: v.nationalId,
    nationalIdType: v.nationalIdType,
    religion: v.religion,
    languagesSpoken: v.languagesSpoken,
    interpreterRequired: v.interpreterRequired,
    formerOccupation: v.formerOccupation,
    hobbies: v.hobbies,
    previousAddress: v.previousAddress,
    admissionDate: v.admissionDate,
    admissionType: v.admissionType,
    admittedFrom: v.admittedFrom,
    referringFacilityName: v.referringFacilityName,
    photoUrl: v.photoUrl && !v.photoUrl.startsWith("data:") ? v.photoUrl : undefined,
  };
}

export function pickStep2(v: AdmissionFormData) {
  const primaryName =
    [v.primaryContact.firstName, v.primaryContact.middleName, v.primaryContact.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || v.primaryContact.name;

  const secondaryName =
    [v.secondaryContact?.firstName, v.secondaryContact?.middleName, v.secondaryContact?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || v.secondaryContact?.name || "";

  const respName =
    [v.responsibleParty.firstName, v.responsibleParty.middleName, v.responsibleParty.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || v.responsibleParty.name;

  return {
    primaryContact: {
      ...v.primaryContact,
      name: primaryName,
    },
    secondaryContact: secondaryName.trim()
      ? {
          ...v.secondaryContact,
          name: secondaryName,
        }
      : undefined,
    responsibleParty: {
      ...v.responsibleParty,
      name: respName,
    },
    legalRep: v.legalRep,
    generalPractitioner: v.generalPractitioner,
    otherProviders: v.otherProviders,
  };
}

export function pickStep3(v: AdmissionFormData) {
  return {
    primaryDiagnosis: v.primaryDiagnosis,
    secondaryDiagnoses: v.secondaryDiagnoses,
    heightCm: v.heightCm || undefined,
    weightKg: v.weightKg || undefined,
    bmi: v.bmi || undefined,
    baselineVitals: v.baselineVitals,
    medicationAllergies: v.medicationAllergies,
    foodAllergies: v.foodAllergies,
    environmentalAllergies: v.environmentalAllergies,
    currentMedications: v.currentMedications?.filter((m) => m.name && m.name.trim().length > 0) ?? [],
    chronicConditions: v.chronicConditions,
    pastSurgeries: v.pastSurgeries,
    immunizationHistory: v.immunizationHistory,
    skinConditionPressureAreas: v.skinConditionPressureAreas,
    continenceStatus: v.continenceStatus,
    sensoryAids: v.sensoryAids,
    dentalStatus: v.dentalStatus,
    substanceUseHistory: v.substanceUseHistory,
    recentHospitalizations: v.recentHospitalizations,
  };
}

export function pickStep4(v: AdmissionFormData) {
  return {
    adlKatzMatrix: v.adlKatzMatrix,
    adlScore: v.adlScore,
    mobilityAidsUsed: v.mobilityAidsUsed,
    fallRiskScore: v.fallRiskScore,
    fallsLast6Months: v.fallsLast6Months,
    ambulationDistance: v.ambulationDistance,
    cognitiveScore: v.cognitiveScore,
    orientation: v.orientation,
    communicationAbility: v.communicationAbility,
    behavioralConcerns: v.behavioralConcerns,
    sleepPattern: v.sleepPattern,
    dietType: v.dietType,
    textureModification: v.textureModification,
    feedingAssistanceNeed: v.feedingAssistanceNeed,
    familyInvolvement: v.familyInvolvement,
    routinePreferences: v.routinePreferences,
  };
}

export function pickStep5(v: AdmissionFormData) {
  return {
    consentChecklist: v.consentChecklist,
    advanceDirectives: v.advanceDirectives,
    poaDocumentUrl: v.poaDocumentUrl,
    guardianshipOrderUrl: v.guardianshipOrderUrl,
    insuranceAssignmentStatus: v.insuranceAssignmentStatus,
  };
}

export function pickStep6(v: AdmissionFormData) {
  return {
    primaryPaymentMethod: v.primaryPaymentMethod,
    secondaryCoverage: v.secondaryCoverage,
    insuranceProvider: v.insuranceProvider,
    insurancePolicyNumber: v.insurancePolicyNumber,
    benefitId: v.benefitId,
    billingResponsibleParty: v.billingResponsibleParty,
    agreedRoomRate: typeof v.agreedRoomRate === "number" && !isNaN(v.agreedRoomRate) ? v.agreedRoomRate : 0,
    agreedRoomRatePeriod: (v.agreedRoomRatePeriod || "Month") as "Day" | "Month" | "Week",
    depositAmount: typeof v.depositAmount === "number" && !isNaN(v.depositAmount) ? v.depositAmount : 0,
    depositDate: v.depositDate,
    paymentSchedule: v.paymentSchedule,
    directDebitDetails: v.directDebitDetails,
    financialPoaDocUrl: v.financialPoaDocUrl,
  };
}

export function pickStep7(v: AdmissionFormData) {
  return {
    assignedBedId: v.assignedBedId || undefined,
    roomNumber: v.roomNumber,
    roomType: v.roomType,
    moveInDateTime: v.moveInDateTime,
    roommate: v.roommate,
    belongings: v.belongings,
    liabilityWaiverSigned: v.liabilityWaiverSigned,
    assistiveDevices: v.assistiveDevices,
    valuablesInSafe: v.valuablesInSafe,
    valuablesDescription: v.valuablesDescription,
  };
}

export function pickStep8(v: AdmissionFormData) {
  return {
    documents: v.documents,
  };
}

export function pickFinalizePayload(v: AdmissionFormData) {
  return {
    staffDeclarationSigned: v.staffDeclarationSigned,
    admittingStaffName: v.admittingStaffName,
    confirmationDateTime: v.confirmationDateTime,
    step1: {
      firstName: v.firstName,
      middleName: v.middleName,
      lastName: v.lastName,
      fullName: v.fullName || `${v.firstName} ${v.lastName}`.trim(),
      preferredName: v.preferredName,
      dob: v.dob,
      gender: v.gender,
      maritalStatus: v.maritalStatus,
      languagesSpoken: v.languagesSpoken,
      interpreterRequired: v.interpreterRequired,
      admissionDate: v.admissionDate,
      admissionType: v.admissionType,
      admittedFrom: v.admittedFrom,
    },
    step2: {
      primaryContact: v.primaryContact,
      responsibleParty: v.responsibleParty,
      legalRep: v.legalRep,
      generalPractitioner: v.generalPractitioner,
      otherProviders: v.otherProviders,
    },
    step3: {
      primaryDiagnosis: v.primaryDiagnosis,
      secondaryDiagnoses: v.secondaryDiagnoses,
      heightCm: v.heightCm,
      weightKg: v.weightKg,
      bmi: v.bmi,
      baselineVitals: v.baselineVitals,
      medicationAllergies: v.medicationAllergies,
      foodAllergies: v.foodAllergies,
      environmentalAllergies: v.environmentalAllergies,
      currentMedications: v.currentMedications?.filter((m) => m.name && m.name.trim().length > 0) ?? [],
      chronicConditions: v.chronicConditions,
      continenceStatus: v.continenceStatus,
    },
    step4: {
      adlKatzMatrix: v.adlKatzMatrix,
      adlScore: v.adlScore,
      mobilityAidsUsed: v.mobilityAidsUsed,
      fallRiskScore: v.fallRiskScore,
      dietType: v.dietType,
      textureModification: v.textureModification,
      feedingAssistanceNeed: v.feedingAssistanceNeed,
    },
    step5: {
      consentChecklist: v.consentChecklist,
      advanceDirectives: v.advanceDirectives,
      insuranceAssignmentStatus: v.insuranceAssignmentStatus,
    },
    step6: {
      primaryPaymentMethod: v.primaryPaymentMethod,
      billingResponsibleParty: v.billingResponsibleParty,
      agreedRoomRate: v.agreedRoomRate,
      agreedRoomRatePeriod: (v.agreedRoomRatePeriod || "Month") as "Day" | "Month" | "Week",
      depositAmount: v.depositAmount,
      paymentSchedule: v.paymentSchedule,
    },
    step7: {
      assignedBedId: v.assignedBedId,
      roomNumber: v.roomNumber,
      roomType: v.roomType,
      belongings: v.belongings?.filter((b) => b.item && b.item.trim().length > 0) ?? [],
      liabilityWaiverSigned: v.liabilityWaiverSigned,
      assistiveDevices: v.assistiveDevices,
      valuablesInSafe: v.valuablesInSafe,
    },
    step8: {
      documents: v.documents,
    },
  };
}
