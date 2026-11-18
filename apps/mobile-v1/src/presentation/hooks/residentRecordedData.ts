import type { PreAdmissionRecordDTO } from '@repo/schema';
import type { Resident } from '../../domain/entities/Resident';
import type { ResidentDetailData } from './useResidentDetail';

export function currentAdmission(records?: Partial<PreAdmissionRecordDTO>[] | null) {
  return records?.find((record) => record.isCurrent === true);
}

/** Adapt recorded onboarding values for existing mobile views; never infer clinical findings. */
export function residentDetailFromRecord(resident: ResidentDetailData): ResidentDetailData {
  const admission = currentAdmission(resident.preAdmissions);
  if (!admission) return resident;
  const a = admission.partA;
  const b = admission.partB;
  const c = admission.partC;
  const d = admission.partD;
  return {
    ...resident,
    dob: a?.dob ?? resident.dob,
    profile: {
      ...resident.profile,
      preferredName: a?.preferredName,
      gender: a?.gender,
      formerOccupation: a?.formerOccupation,
      religion: a?.religion,
      addressLine1: a?.previousAddress,
      hobbies: admission.partG?.loves,
    },
    gpDetails: b?.gp
      ? {
          gpName: b.gp.name ?? undefined,
          practice: b.gp.practice ?? undefined,
          phone: b.gp.phone ?? undefined,
        }
      : null,
    nextOfKin: b?.nextOfKin?.map((contact) => ({
      name: contact.name,
      relationship: contact.relationship ?? undefined,
      phone: contact.phone ?? undefined,
      email: contact.email ?? undefined,
    })),
    admission: {
      ...resident.admission,
      admissionReason: a?.admissionReason,
      stayType: a?.stayType,
    },
    careProfile: {
      careCategory: a?.typeOfCare,
      primaryDiagnosis: c?.primaryDiagnosis,
      secondaryDiagnoses: c?.secondaryDiagnoses,
      chronicConditions: c?.diagnoses,
      allergies: c?.allergies?.map((allergy) => allergy.substance),
      mobilityAidsUsed: d?.mobilityAids,
      dietType: d?.dietType,
      feedingAssistanceNeed: d?.feedingAssistanceNeed,
      routinePreferences: d?.routinePreferences,
    },
  };
}

export function enrichResidentFromRecord(resident: Resident, record: ResidentDetailData): Resident {
  const admission = currentAdmission(record.preAdmissions);
  const dob = admission?.partA?.dob ?? record.dob;
  const birth = dob ? new Date(dob) : null;
  let age: number | undefined;
  if (birth && Number.isFinite(birth.getTime()) && birth <= new Date()) {
    const today = new Date();
    age = today.getFullYear() - birth.getFullYear();
    if (
      today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
    )
      age--;
  }
  const clinical = admission?.partC;
  const dnacprStatus = admission?.partF?.dnacpr?.status;
  const fallRisk = admission?.partD?.fallsRiskLevel ?? record.fallsRiskLevel;
  return {
    ...resident,
    fullName: record.fullName,
    status: ['Active', 'Discharged', 'Hospitalized', 'Deceased', 'Transferred'].includes(
      record.status,
    )
      ? (record.status as Resident['status'])
      : undefined,
    dateOfBirth: dob ?? '',
    age: age ?? resident.age,
    gender: admission?.partA?.gender ?? record.profile?.gender ?? resident.gender,
    allergies: clinical?.allergies?.map((allergy) => ({
      allergen: allergy.substance,
      severity: allergy.severity ?? undefined,
    })),
    noKnownAllergies: clinical?.noKnownAllergies === true && !clinical.allergies?.length,
    allergySummary: record.allergySummary ?? undefined,
    dnacpr: dnacprStatus === 'InPlace' ? true : dnacprStatus === 'NotInPlace' ? false : undefined,
    riskRatings: {
      fallRisk:
        fallRisk === 'Low' || fallRisk === 'Medium' || fallRisk === 'High' ? fallRisk : undefined,
    },
    communicationNeeds: admission?.partD?.communicationAbility ?? undefined,
    photoUrl: record.photoUrl ?? resident.photoUrl,
    roomNumber: record.bed?.room?.roomNumber ?? resident.roomNumber,
    bedNumber: record.bed?.bedLabel ?? record.bed?.number ?? resident.bedNumber,
    wingName: record.bed?.room?.wing?.name ?? resident.wingName,
  };
}
