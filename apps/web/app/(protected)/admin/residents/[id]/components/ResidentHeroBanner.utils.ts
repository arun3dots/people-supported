import { calculateAge, type SupportedLivingDetailsDTO } from "@repo/schema";
import type { PropertyItem, Room, SchemeItem } from "../../../../../../lib/types/facility";
import type { RiskAssessmentResponse } from "../../../../../../lib/queries/risk";

export { calculateAge };

export const TABS = [
  { id: "overview", label: "Profile" },
  { id: "careplan", label: "Support Plan" },
  { id: "assessments", label: "Assessments" },
  { id: "mar", label: "Medication" },
  { id: "incidents", label: "Incidents" },
  { id: "documents", label: "Documents" },
  { id: "timeline", label: "History" },
] as const;

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
  allergySummary?: string | null;
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

export interface HeroPartCAllergiesInput {
  allergies?: Array<{ substance: string; reaction?: string | null }> | null;
  noKnownAllergies?: boolean | null;
}

export function getAllergiesList(
  resident: ResidentHeroData | null | undefined,
  preAdmissionPartC?: HeroPartCAllergiesInput | null,
): string[] {
  if (!resident) return [];
  const cp = resident.careProfile;
  const fromPartC = (preAdmissionPartC?.allergies ?? [])
    .map((a) => {
      const sub = a.substance?.trim();
      if (!sub) return "";
      const reaction = a.reaction?.trim();
      return reaction ? `${sub} (${reaction})` : sub;
    })
    .filter(Boolean);

  const rawSummary = resident.allergySummary?.trim();
  const fromSummary =
    rawSummary &&
    !/^no known allergies$/i.test(rawSummary) &&
    !/^none$/i.test(rawSummary)
      ? rawSummary.split(",").map((s) => s.trim())
      : [];

  const rawAllergies: string[] = [
    ...fromPartC,
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
    ...fromSummary,
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

export function formatRoomLabel(rawRoom?: string | null): string | null {
  const trimmed = rawRoom?.trim();
  if (!trimmed) return null;
  return /^(flat|room|apt|apartment|unit)\b/i.test(trimmed)
    ? trimmed
    : `Room ${trimmed}`;
}

export function resolveHeroLocation({
  resident,
  preAdmissionRoom,
  schemes,
  properties,
  rooms,
}: {
  resident: ResidentHeroData;
  preAdmissionRoom?: { roomNumber?: string | null } | null;
  schemes: SchemeItem[];
  properties: PropertyItem[];
  rooms: Room[];
}) {
  const bedWing = resident.bed?.room?.wing;
  const rawRoom =
    resident.bed?.room?.roomNumber ||
    preAdmissionRoom?.roomNumber ||
    resident.room ||
    null;
  const roomLabel = formatRoomLabel(rawRoom);

  const matchedRoom =
    !bedWing && rawRoom
      ? rooms.find(
          (r) => r.roomNumber.trim().toLowerCase() === rawRoom.trim().toLowerCase(),
        )
      : undefined;
  const matchedProp =
    !bedWing && matchedRoom
      ? properties.find((p) => p.id === matchedRoom.wingId)
      : undefined;

  const propertyId = bedWing?.id || matchedProp?.id || null;
  const propertyName =
    resident.bed?.wingName || bedWing?.name || matchedProp?.name || null;
  const schemeName =
    bedWing?.scheme?.name ||
    matchedProp?.scheme?.name ||
    (matchedProp?.schemeId
      ? schemes.find((s) => s.id === matchedProp.schemeId)?.name ?? null
      : null) ||
    null;

  const rawBed = resident.bed?.number?.trim() || null;
  const bedLabel = rawBed
    ? /^bed\b/i.test(rawBed)
      ? rawBed
      : `Bed ${rawBed}`
    : null;

  return {
    hasSchemeOrProperty: Boolean(schemeName || propertyName),
    schemeName,
    propertyId,
    propertyName,
    roomLabel,
    bedLabel,
  };
}

export function resolveHeroMetadata(
  resident: ResidentHeroData,
  riskAssessments: RiskAssessmentResponse[] | undefined,
  preAdmissionPartC?: HeroPartCAllergiesInput | null,
) {
  const hasDnacpr = Boolean(
    resident.dnarStatus ||
      resident.dnacprStatus ||
      resident.admission?.dnarStatus ||
      (typeof resident.consent?.dnarStatus === "string" &&
        resident.consent.dnarStatus.toLowerCase() === "dnr"),
  );

  const activeHighRisks = (riskAssessments || []).filter((ra) => {
    const lvl = ra.residualLevel || ra.inherentLevel;
    return (lvl === "High" || lvl === "Extreme") && ra.status !== "Archived";
  });

  const uniqueHighRiskBadges = activeHighRisks.reduce<
    Array<{ id: string; label: string; level: string }>
  >((acc, ra) => {
    const label = (ra.title || ra.template?.name || ra.category || "").trim();
    const level = ra.residualLevel || ra.inherentLevel;
    if (
      label &&
      !acc.some((item) => item.label.toLowerCase() === label.toLowerCase())
    ) {
      acc.push({ id: ra.id, label, level });
    }
    return acc;
  }, []);

  const sl = resident.supportedLivingDetails ?? {};
  const severityLevel =
    resident.severity ||
    resident.careComplexity ||
    resident.careProfile?.careComplexity ||
    sl.riskLevel ||
    (activeHighRisks.length > 0 ? "High" : null);

  const genderVal = resident.profile?.gender || resident.gender || null;
  const ageVal = calculateAge(resident.dob);
  const maritalStatusVal = resident.profile?.maritalStatus || null;
  const rawNhs = resident.nhsNumber || resident.profile?.nationalId || null;
  const nhsLabel = rawNhs
    ? /^nhs/i.test(rawNhs.trim())
      ? rawNhs.trim()
      : `NHS-${rawNhs.trim()}`
    : null;

  const subtitleItems = [
    genderVal,
    ageVal !== null ? `${ageVal} years` : null,
    maritalStatusVal,
    nhsLabel,
  ].filter((val): val is string => Boolean(val));

  const severityBadgeClass =
    severityLevel === "High" || severityLevel === "Extreme"
      ? "bg-red-700 text-white border-transparent"
      : severityLevel === "Low"
        ? "bg-emerald-700 text-white border-transparent"
        : "bg-amber-600 text-white border-transparent";

  const allergyList = getAllergiesList(resident, preAdmissionPartC);
  const hasNoKnownAllergies =
    allergyList.length === 0 &&
    Boolean(
      preAdmissionPartC?.noKnownAllergies ||
        /^no known allergies$/i.test(resident.allergySummary?.trim() || ""),
    );

  return {
    hasDnacpr,
    uniqueHighRiskBadges,
    severityLevel,
    severityBadgeClass,
    subtitleItems,
    allergyList,
    hasNoKnownAllergies,
    keyworkerName: resident.keyworker?.fullName || "Unassigned",
  };
}
