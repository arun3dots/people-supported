import { BodyMapVariantType } from "@repo/schema";

interface ResidentDemographics {
  gender?: string | null;
  sex?: string | null;
  profile?: {
    gender?: string | null;
    sex?: string | null;
  } | null;
  admission?: {
    gender?: string | null;
    sex?: string | null;
  } | null;
  admissionData?: {
    step1?: {
      gender?: string | null;
      sex?: string | null;
    } | null;
  } | null;
  personalDetails?: {
    gender?: string | null;
    sex?: string | null;
  } | null;
}

/**
 * Resolves the appropriate Body Map SVG illustration variant
 * based on the resident's validated demographic profile.
 *
 * Normalizes:
 * - "male", "Male", "MALE", "m", "M" -> "male"
 * - "female", "Female", "FEMALE", "f", "F" -> "female"
 * Defaults to "neutral" when gender is absent, unrecorded, or non-binary.
 *
 * NEVER mutates resident demographic data.
 */
export function getBodyMapVariant(
  resident?: ResidentDemographics | null,
): BodyMapVariantType {
  if (!resident) return "neutral";

  const raw =
    resident.gender ||
    resident.sex ||
    resident.profile?.gender ||
    resident.profile?.sex ||
    resident.admission?.gender ||
    resident.admission?.sex ||
    resident.admissionData?.step1?.gender ||
    resident.admissionData?.step1?.sex ||
    resident.personalDetails?.gender ||
    resident.personalDetails?.sex ||
    "";

  const normalized = String(raw).trim().toLowerCase();

  if (normalized === "male" || normalized === "m") {
    return "male";
  }

  if (normalized === "female" || normalized === "f") {
    return "female";
  }

  return "neutral";
}
