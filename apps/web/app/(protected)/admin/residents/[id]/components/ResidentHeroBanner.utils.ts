import type { SupportedLivingDetailsDTO } from "@repo/schema";

export const TABS = [
  { id: "overview", label: "Profile" },
  { id: "careplan", label: "Support Plan" },
  { id: "assessments", label: "Assessments" },
  { id: "mar", label: "Medication" },
  { id: "incidents", label: "Incidents" },
  { id: "documents", label: "Documents" },
  { id: "timeline", label: "History" },
] as const;

export { calculateAge } from "@repo/schema";

export function getInitials(name?: string | null, fallback = "DL"): string {
  if (!name?.trim()) return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]?.[0]?.toUpperCase() || fallback;
  return `${parts[0]?.[0] || ""}${parts[parts.length - 1]?.[0] || ""}`.toUpperCase();
}

export interface ResidentHeroData {
  id?: string;
  fullName?: string;
  dob?: string;
  photoUrl?: string;
  nhsNumber?: string;
  status?: string;
  isDraft?: boolean;
  fundingType?: string | null;
  dnarStatus?: string | boolean | null;
  dnacprStatus?: string | boolean | null;
  gender?: string | null;
  careComplexity?: string | null;
  fallRiskScore?: string | number | null;
  severity?: string | null;
  fallRisk?: string | null;
  room?: string | null;
  supportedLivingDetails?: SupportedLivingDetailsDTO | null;
  profile?: {
    preferredName?: string | null;
    gender?: string | null;
    maritalStatus?: string | null;
    nationalId?: string | null;
  } | null;
  bed?: {
    room?: {
      roomNumber?: string | null;
      wing?: {
        id?: string;
        name?: string | null;
        scheme?: {
          id?: string;
          name?: string | null;
        } | null;
      } | null;
    } | null;
    wingName?: string | null;
    number?: string | null;
  } | null;
  keyworker?: {
    fullName?: string | null;
  } | null;
  careProfile?: {
    careComplexity?: string | null;
    careCategory?: string | null;
    fallRiskScore?: string | number | null;
    allergies?: unknown;
    medicationAllergies?: unknown;
    foodAllergies?: unknown;
    environmentalAllergies?: unknown;
  } | null;
  admission?: {
    dnarStatus?: string | boolean | null;
    fallRiskScore?: string | number | null;
    localAuthority?: string | null;
    payer?: string | null;
  } | null;
  consent?: {
    dnarStatus?: string | boolean | null;
  } | null;
  carePlans?: Array<{
    status?: string;
    versionNumber?: number;
    nextReviewDate?: string | null;
  }>;
}

export function getAllergiesList(
  resident: ResidentHeroData | null | undefined,
): string[] {
  if (!resident) return [];
  const cp = resident.careProfile;
  const rawAllergies: string[] = [
    ...(Array.isArray(cp?.allergies) ? (cp.allergies as string[]) : []),
    ...(Array.isArray(cp?.medicationAllergies)
      ? (cp.medicationAllergies as string[])
      : []),
    ...(Array.isArray(cp?.foodAllergies) ? (cp.foodAllergies as string[]) : []),
    ...(Array.isArray(cp?.environmentalAllergies)
      ? (cp.environmentalAllergies as string[])
      : []),
    ...(typeof cp?.allergies === "string"
      ? cp.allergies.split(",").map((s) => s.trim())
      : []),
  ];
  return Array.from(new Set(rawAllergies.filter(Boolean)));
}

export function getReviewStatus(nextReviewDateVal?: string | null) {
  if (!nextReviewDateVal) return null;
  const nextDate = new Date(nextReviewDateVal);
  if (isNaN(nextDate.getTime())) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(
    nextDate.getFullYear(),
    nextDate.getMonth(),
    nextDate.getDate(),
  );
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) {
    return {
      text: `Next review Overdue ${Math.abs(diffDays)}d`,
      isOverdue: true,
    };
  } else if (diffDays === 0) {
    return { text: "Next review Due Today", isOverdue: true };
  } else {
    return { text: `Next review in ${diffDays}d`, isOverdue: false };
  }
}
