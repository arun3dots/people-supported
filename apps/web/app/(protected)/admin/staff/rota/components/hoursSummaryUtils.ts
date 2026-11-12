import type {
  PropertyItem,
  SchemeItem,
} from "../../../../../../lib/types/facility";
import type { Resident } from "../../../../../../lib/types/resident";
import type { Shift } from "../../../../../../lib/types/shifts";
import type { StaffMember } from "../../../../../../lib/types/staff";
import type { DayHoursPoint } from "./HoursSummaryCharts";
import type { HoursBreakdownRow } from "./HoursSummaryTable";
import type { DayColumnInfo } from "./WeeklyRotaScheduleTable";
import {
  getCommissionedHours,
  getResidentCommissionedHours,
  getShiftDateStr,
  getShiftDeliveredHours,
  getShiftPlannedHours,
  getShiftStaffIds,
  resolveShiftLocation,
  roundHours,
} from "./rotaDataUtils";

export interface HoursSummaryMetrics {
  required: number;
  planned: number;
  delivered: number;
  gap: number;
  overtime: number;
  gapPercent: string;
  coveragePercent: string;
  overtimePercent: string;
}

export function getScopedCommissionedHours(
  schemes: SchemeItem[],
  properties: PropertyItem[],
  residents: Resident[],
  schemeFilter: string,
  propertyFilter: string,
): number {
  if (propertyFilter !== "all") {
    const propResidents = residents.filter(
      (r) => r.bed?.room?.wing?.id === propertyFilter,
    );
    const resHours = getResidentCommissionedHours(propResidents);
    if (resHours > 0) return resHours;
    const prop = properties.find((p) => p.id === propertyFilter);
    const scheme = schemes.find((s) => s.id === prop?.schemeId);
    if (scheme?.commissionedHours && scheme.properties.length === 1) {
      return roundHours(scheme.commissionedHours);
    }
    return 0;
  }

  if (schemeFilter !== "all") {
    const scheme = schemes.find((s) => s.id === schemeFilter);
    if (scheme?.commissionedHours) return roundHours(scheme.commissionedHours);
    const propIds = new Set(
      properties.filter((p) => p.schemeId === schemeFilter).map((p) => p.id),
    );
    return getResidentCommissionedHours(
      residents.filter(
        (r) =>
          r.bed?.room?.wing?.schemeId === schemeFilter ||
          (r.bed?.room?.wing?.id ? propIds.has(r.bed.room.wing.id) : false),
      ),
    );
  }

  return getCommissionedHours(schemes, residents);
}

export function buildHoursSummaryMetrics(
  required: number,
  filteredShifts: Shift[],
  staff: StaffMember[],
): HoursSummaryMetrics {
  const planned = roundHours(
    filteredShifts.reduce((acc, s) => acc + getShiftPlannedHours(s), 0),
  );
  const delivered = roundHours(
    filteredShifts.reduce((acc, s) => acc + getShiftDeliveredHours(s), 0),
  );
  const gap = Math.max(0, roundHours(required - planned));

  const hoursByStaff = new Map<string, number>();
  filteredShifts.forEach((s) => {
    const hrs = getShiftPlannedHours(s);
    getShiftStaffIds(s).forEach((uid) => {
      hoursByStaff.set(uid, (hoursByStaff.get(uid) ?? 0) + hrs);
    });
  });

  const overtime = roundHours(
    staff.reduce((sum, m) => {
      const contracted = m.contractedHoursPerWeek ?? 0;
      if (contracted <= 0) return sum;
      const assigned = hoursByStaff.get(m.id) ?? 0;
      return sum + Math.max(0, assigned - contracted);
    }, 0),
  );

  const gapPercent =
    required > 0 ? ((gap / required) * 100).toFixed(1) : "0.0";
  const coveragePercent =
    required > 0
      ? ((delivered / required) * 100).toFixed(1)
      : planned > 0
        ? ((delivered / planned) * 100).toFixed(1)
        : "0.0";

  return {
    required,
    planned,
    delivered,
    gap,
    overtime,
    gapPercent,
    coveragePercent,
    overtimePercent:
      planned > 0 ? ((overtime / planned) * 100).toFixed(1) : "0.0",
  };
}

export function buildDailyHoursPoints(
  days: DayColumnInfo[],
  filteredShifts: Shift[],
  required: number,
): DayHoursPoint[] {
  const dailyReq =
    required > 0 && days.length > 0 ? roundHours(required / days.length) : 0;

  return days.map((d) => {
    const dayShifts = filteredShifts.filter(
      (s) => getShiftDateStr(s) === d.dateStr,
    );
    return {
      day: d.dayName,
      req: dailyReq,
      plan: roundHours(
        dayShifts.reduce((sum, s) => sum + getShiftPlannedHours(s), 0),
      ),
      del: roundHours(
        dayShifts.reduce((sum, s) => sum + getShiftDeliveredHours(s), 0),
      ),
    };
  });
}

function getRowStatus(
  commissioned: number,
  planned: number,
): HoursBreakdownRow["status"] {
  if (commissioned === 0 && planned === 0) return "No data";
  if (commissioned > 0 && planned < commissioned) return "Shortfall";
  return "On track";
}

function formatCoverage(
  commissioned: number,
  planned: number,
): string {
  if (commissioned <= 0) {
    return planned > 0 ? "100.0%" : "0.0%";
  }
  return `${((planned / commissioned) * 100).toFixed(1)}%`;
}

export function buildHoursBreakdownRows(params: {
  viewMode: "both" | "scheme" | "property";
  schemeFilter: string;
  propertyFilter: string;
  schemes: SchemeItem[];
  properties: PropertyItem[];
  filteredProperties: PropertyItem[];
  filteredShifts: Shift[];
  residents: Resident[];
}): HoursBreakdownRow[] {
  const {
    viewMode,
    schemeFilter,
    propertyFilter,
    schemes,
    properties,
    filteredProperties,
    filteredShifts,
    residents,
  } = params;

  if (viewMode === "scheme") {
    const targetSchemes =
      schemeFilter === "all"
        ? schemes
        : schemes.filter((s) => s.id === schemeFilter);

    return targetSchemes.map((scheme) => {
      const schemePropIds = new Set(
        properties.filter((p) => p.schemeId === scheme.id).map((p) => p.id),
      );
      const schemeShifts = filteredShifts.filter(
        (s) => resolveShiftLocation(s, properties, schemes, residents).schemeId === scheme.id,
      );
      const schemeResidents = residents.filter(
        (r) =>
          r.bed?.room?.wing?.schemeId === scheme.id ||
          (r.bed?.room?.wing?.id ? schemePropIds.has(r.bed.room.wing.id) : false),
      );
      const commissioned = roundHours(
        scheme.commissionedHours || getResidentCommissionedHours(schemeResidents),
      );
      const planned = roundHours(
        schemeShifts.reduce((sum, s) => sum + getShiftPlannedHours(s), 0),
      );
      const delivered = roundHours(
        schemeShifts.reduce((sum, s) => sum + getShiftDeliveredHours(s), 0),
      );

      return {
        key: scheme.id,
        scheme: scheme.name,
        property: null,
        commissioned,
        planned,
        delivered,
        variance: commissioned > 0 ? roundHours(planned - commissioned) : 0,
        coverage: formatCoverage(commissioned, planned),
        status: getRowStatus(commissioned, planned),
      };
    });
  }

  const targetProps =
    propertyFilter === "all"
      ? filteredProperties
      : filteredProperties.filter((p) => p.id === propertyFilter);

  const propRows: HoursBreakdownRow[] = targetProps.map((prop) => {
    const parentScheme = schemes.find((s) => s.id === prop.schemeId);
    const propShifts = filteredShifts.filter(
      (s) => resolveShiftLocation(s, properties, schemes, residents).propertyId === prop.id,
    );
    const propResidents = residents.filter(
      (r) => r.bed?.room?.wing?.id === prop.id,
    );
    const resHours = getResidentCommissionedHours(propResidents);
    const commissioned =
      resHours > 0
        ? resHours
        : parentScheme?.commissionedHours && parentScheme.properties.length === 1
          ? roundHours(parentScheme.commissionedHours)
          : 0;
    const planned = roundHours(
      propShifts.reduce((sum, s) => sum + getShiftPlannedHours(s), 0),
    );
    const delivered = roundHours(
      propShifts.reduce((sum, s) => sum + getShiftDeliveredHours(s), 0),
    );

    return {
      key: prop.id,
      scheme: parentScheme?.name ?? prop.scheme?.name ?? "Unassigned Scheme",
      property: prop.name,
      commissioned,
      planned,
      delivered,
      variance: commissioned > 0 ? roundHours(planned - commissioned) : 0,
      coverage: formatCoverage(commissioned, planned),
      status: getRowStatus(commissioned, planned),
    };
  });

  const unassignedShifts = filteredShifts.filter(
    (s) => !resolveShiftLocation(s, properties, schemes, residents).propertyId,
  );
  if (unassignedShifts.length > 0 && propertyFilter === "all") {
    const planned = roundHours(
      unassignedShifts.reduce((sum, s) => sum + getShiftPlannedHours(s), 0),
    );
    const delivered = roundHours(
      unassignedShifts.reduce((sum, s) => sum + getShiftDeliveredHours(s), 0),
    );
    propRows.push({
      key: "unassigned",
      scheme: "Unassigned Scheme",
      property: "Unassigned Property",
      commissioned: 0,
      planned,
      delivered,
      variance: 0,
      coverage: formatCoverage(0, planned),
      status: getRowStatus(0, planned),
    });
  }

  return propRows;
}
