import type {
  PropertyItem,
  SchemeItem,
} from "../../../../../../lib/types/facility";
import type { Resident } from "../../../../../../lib/types/resident";
import type { Shift } from "../../../../../../lib/types/shifts";
import type { StaffMember } from "../../../../../../lib/types/staff";

export interface ResolvedStaffLocation {
  schemeId: string | null;
  schemeName: string | null;
  propertyId: string | null;
  propertyName: string | null;
}

export interface ResolvedShiftLocation {
  schemeId: string | null;
  schemeName: string | null;
  propertyId: string | null;
  propertyName: string | null;
}

export interface CareTypeBreakdown {
  totalHours: number;
  sharedHours: number;
  oneToOneHours: number;
  twoToOneHours: number;
  sleepInHours: number;
  wakingNightHours: number;
}

export function roundHours(hours: number): number {
  return Math.round(hours * 10) / 10;
}

export function getShiftDateStr(shift: Shift): string {
  const start = new Date(shift.startTime);
  if (Number.isNaN(start.getTime())) return "";
  return start.toISOString().split("T")[0] ?? "";
}

export function getShiftPlannedHours(shift: Shift): number {
  if (shift.careType?.includes("Off")) return 0;
  if (typeof shift.durationHours === "number" && Number.isFinite(shift.durationHours)) {
    return Math.max(0, roundHours(shift.durationHours));
  }
  const startMs = new Date(shift.startTime).getTime();
  const endMs = new Date(shift.endTime).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return 0;
  }
  return roundHours((endMs - startMs) / (1000 * 60 * 60));
}

export function getShiftDeliveredHours(shift: Shift): number {
  if (shift.careType?.includes("Off")) return 0;
  if (
    typeof shift.actualHoursWorked === "number" &&
    Number.isFinite(shift.actualHoursWorked)
  ) {
    return Math.max(0, roundHours(shift.actualHoursWorked));
  }
  if (shift.staffLogs && shift.staffLogs.length > 0) {
    const loggedHours = shift.staffLogs.reduce((sum, log) => {
      if (!log.actualStartTime || !log.actualEndTime) return sum;
      const startMs = new Date(log.actualStartTime).getTime();
      const endMs = new Date(log.actualEndTime).getTime();
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
        return sum;
      }
      return sum + (endMs - startMs) / (1000 * 60 * 60);
    }, 0);
    if (loggedHours > 0) return roundHours(loggedHours);
  }
  if (shift.isCompleted || shift.status === "Completed") {
    return getShiftPlannedHours(shift);
  }
  return 0;
}

export function getShiftAssignedResidentIds(shift: Shift): string[] {
  const ids = new Set<string>();
  shift.assignments?.forEach((assignment) => {
    assignment.assignedResidentIds?.forEach((id) => {
      if (id) ids.add(id);
    });
  });
  return Array.from(ids);
}

export function getShiftStaffIds(shift: Shift): string[] {
  const ids = new Set<string>();
  shift.userIds?.forEach((id) => {
    if (id) ids.add(id);
  });
  shift.assignments?.forEach((assignment) => {
    if (assignment.userId) ids.add(assignment.userId);
  });
  return Array.from(ids);
}

export function resolveStaffLocation(
  staff: StaffMember,
  schemes: SchemeItem[],
  properties: PropertyItem[],
): ResolvedStaffLocation {
  const rawPropertyId = staff.propertyId ?? staff.assignedWings?.[0]?.id ?? null;
  const matchedProperty = rawPropertyId
    ? properties.find((p) => p.id === rawPropertyId)
    : undefined;

  const propertyId = matchedProperty?.id ?? rawPropertyId;
  const propertyName =
    matchedProperty?.name ??
    staff.property?.name ??
    staff.assignedWings?.[0]?.name ??
    null;

  const rawSchemeId =
    staff.schemeId ??
    staff.scheme?.id ??
    matchedProperty?.schemeId ??
    matchedProperty?.scheme?.id ??
    null;
  const matchedScheme = rawSchemeId
    ? schemes.find((s) => s.id === rawSchemeId)
    : undefined;

  const schemeId = matchedScheme?.id ?? rawSchemeId;
  const schemeName =
    matchedScheme?.name ??
    staff.scheme?.name ??
    matchedProperty?.scheme?.name ??
    null;

  return { schemeId, schemeName, propertyId, propertyName };
}

export function resolveShiftLocation(
  shift: Shift,
  properties: PropertyItem[],
  schemes: SchemeItem[],
  residents: Resident[],
): ResolvedShiftLocation {
  let matchedProperty = shift.wingId
    ? properties.find((p) => p.id === shift.wingId)
    : undefined;

  if (!matchedProperty) {
    const residentIds = getShiftAssignedResidentIds(shift);
    for (const residentId of residentIds) {
      const resident = residents.find((r) => r.id === residentId);
      const wingId = resident?.bed?.room?.wing?.id;
      if (wingId) {
        matchedProperty = properties.find((p) => p.id === wingId);
        if (matchedProperty) break;
      }
    }
  }

  const propertyId = matchedProperty?.id ?? shift.wingId ?? null;
  const propertyName =
    matchedProperty?.name ??
    shift.wing?.name ??
    shift.wardName ??
    shift.location ??
    null;

  const schemeId =
    matchedProperty?.schemeId ?? matchedProperty?.scheme?.id ?? null;
  const matchedScheme = schemeId
    ? schemes.find((s) => s.id === schemeId)
    : undefined;

  return {
    schemeId,
    schemeName: matchedScheme?.name ?? matchedProperty?.scheme?.name ?? null,
    propertyId,
    propertyName,
  };
}

export function getResidentCommissionedHours(residents: Resident[]): number {
  return roundHours(
    residents.reduce(
      (sum, resident) =>
        sum + (resident.supportedLivingDetails?.supportHoursPerWeek ?? 0),
      0,
    ),
  );
}

export function getCommissionedHours(
  schemes: SchemeItem[],
  residents: Resident[],
): number {
  const schemeHours = roundHours(
    schemes.reduce((sum, scheme) => sum + (scheme.commissionedHours ?? 0), 0),
  );
  if (schemeHours > 0) return schemeHours;
  return getResidentCommissionedHours(residents);
}

export function computeRotaMetrics(
  schemes: SchemeItem[],
  residents: Resident[],
  weekShifts: Shift[],
) {
  const commissionedHours = getCommissionedHours(schemes, residents);
  let deliveredHours = 0;
  let plannedHours = 0;
  weekShifts.forEach((s) => {
    deliveredHours += getShiftDeliveredHours(s);
    plannedHours += getShiftPlannedHours(s);
  });
  deliveredHours = roundHours(deliveredHours);
  plannedHours = roundHours(plannedHours);
  const targetHours = commissionedHours > 0 ? commissionedHours : plannedHours;
  const completionRate =
    targetHours > 0
      ? Math.min(100, Math.round((deliveredHours / targetHours) * 100))
      : 0;
  return {
    peopleSupportedCount: residents.length,
    commissionedHours,
    deliveredHours,
    plannedHours,
    completionRate,
  };
}

export function getCareTypeBreakdown(shifts: Shift[]): CareTypeBreakdown {
  let sharedHours = 0;
  let oneToOneHours = 0;
  let twoToOneHours = 0;
  let sleepInHours = 0;
  let wakingNightHours = 0;

  shifts.forEach((shift) => {
    const hours = getShiftPlannedHours(shift);
    if (hours <= 0) return;
    const careType = shift.careType || "Shared Care (Core Support)";
    if (careType.includes("2:1")) {
      twoToOneHours += hours;
    } else if (careType.includes("1:1")) {
      oneToOneHours += hours;
    } else if (careType.includes("Sleep-in")) {
      sleepInHours += hours;
    } else if (careType.includes("Waking Night")) {
      wakingNightHours += hours;
    } else {
      sharedHours += hours;
    }
  });

  const roundedShared = roundHours(sharedHours);
  const roundedOneToOne = roundHours(oneToOneHours);
  const roundedTwoToOne = roundHours(twoToOneHours);
  const roundedSleepIn = roundHours(sleepInHours);
  const roundedWakingNight = roundHours(wakingNightHours);

  return {
    totalHours: roundHours(
      roundedShared + roundedOneToOne + roundedTwoToOne + roundedSleepIn + roundedWakingNight,
    ),
    sharedHours: roundedShared,
    oneToOneHours: roundedOneToOne,
    twoToOneHours: roundedTwoToOne,
    sleepInHours: roundedSleepIn,
    wakingNightHours: roundedWakingNight,
  };
}

export interface CareBlockAppearance {
  cellClassName: string;
  shortLabel: string;
  subLabel: string;
  isSleepIn: boolean;
  isNight: boolean;
  isOff: boolean;
}

export function getCareBlockAppearance(
  careType?: string | null,
  residentCount = 0,
): CareBlockAppearance {
  const cType = careType || "Shared Care (Core Support)";
  const isSleepIn = cType.includes("Sleep-in");
  const isNight = cType.includes("Waking Night");
  const isOff = cType.includes("Off");

  if (cType.includes("2:1")) {
    return { cellClassName: "bg-indigo-50 text-indigo-900 hover:bg-indigo-100/70", shortLabel: "2:1", subLabel: "2:1 Support", isSleepIn, isNight, isOff };
  }
  if (cType.includes("1:1")) {
    return { cellClassName: "bg-surface-primary-light text-primary hover:bg-emerald-100/70", shortLabel: "1:1", subLabel: "1:1 Support", isSleepIn, isNight, isOff };
  }
  if (isSleepIn) {
    return { cellClassName: "bg-amber-50 text-amber-900 hover:bg-amber-100/70", shortLabel: "Sleep-in", subLabel: "Overnight", isSleepIn, isNight, isOff };
  }
  if (isNight) {
    return { cellClassName: "bg-rose-50 text-rose-900 hover:bg-rose-100/70", shortLabel: "Night", subLabel: "Waking Night", isSleepIn, isNight, isOff };
  }
  if (isOff) {
    return { cellClassName: "bg-white/60 text-slate-500 hover:bg-white", shortLabel: "Off", subLabel: "Rest Day", isSleepIn, isNight, isOff };
  }

  return {
    cellClassName: "bg-white text-slate-800 hover:bg-slate-50",
    shortLabel: "Shared",
    subLabel: residentCount > 0 ? `${residentCount} ${residentCount === 1 ? "person" : "people"}` : "Shared Care",
    isSleepIn,
    isNight,
    isOff,
  };
}
