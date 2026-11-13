import { describe, it, expect } from "vitest";
import type { PropertyItem, SchemeItem } from "../../../../../../lib/types/facility";
import type { Resident } from "../../../../../../lib/types/resident";
import type { Shift } from "../../../../../../lib/types/shifts";
import type { StaffMember } from "../../../../../../lib/types/staff";
import {
  buildDailyHoursPoints,
  buildHoursBreakdownRows,
  buildHoursSummaryMetrics,
  getScopedCommissionedHours,
} from "./hoursSummaryUtils";
import {
  getCareTypeBreakdown,
  getCommissionedHours,
  getShiftDeliveredHours,
  getShiftPlannedHours,
  resolveStaffLocation,
} from "./rotaDataUtils";
import type { DayColumnInfo } from "./WeeklyRotaScheduleTable";

const SAMPLE_DAYS: DayColumnInfo[] = [
  { key: "2026-11-09", dayName: "Mon", dayNumber: "09 Nov", dateStr: "2026-11-09" },
  { key: "2026-11-10", dayName: "Tue", dayNumber: "10 Nov", dateStr: "2026-11-10" },
];

describe("rotaDataUtils & hoursSummaryUtils (no fallback data)", () => {
  it("returns zeroes and empty rows when database lists are empty", () => {
    expect(getCommissionedHours([], [])).toBe(0);
    expect(getScopedCommissionedHours([], [], [], "all", "all")).toBe(0);

    const breakdown = getCareTypeBreakdown([]);
    expect(breakdown).toEqual({
      totalHours: 0,
      sharedHours: 0,
      oneToOneHours: 0,
      twoToOneHours: 0,
      sleepInHours: 0,
      wakingNightHours: 0,
    });

    const metrics = buildHoursSummaryMetrics(0, [], []);
    expect(metrics).toEqual({
      required: 0,
      planned: 0,
      delivered: 0,
      gap: 0,
      overtime: 0,
      gapPercent: "0.0",
      coveragePercent: "0.0",
      overtimePercent: "0.0",
    });

    const daily = buildDailyHoursPoints(SAMPLE_DAYS, [], 0);
    expect(daily).toEqual([
      { day: "Mon", req: 0, plan: 0, del: 0 },
      { day: "Tue", req: 0, plan: 0, del: 0 },
    ]);

    const rows = buildHoursBreakdownRows({
      viewMode: "both",
      schemeFilter: "all",
      propertyFilter: "all",
      schemes: [],
      properties: [],
      filteredProperties: [],
      filteredShifts: [],
      residents: [],
    });
    expect(rows).toEqual([]);
  });

  it("computes metrics and resolves unassigned locations honestly from DB entities", () => {
    const scheme = {
      id: "sch-1",
      name: "Meadow Scheme",
      commissionedHours: 70,
      properties: [{ id: "prop-1", name: "Maple Cottage", code: null, status: "Active" }],
    } as unknown as SchemeItem;

    const property = {
      id: "prop-1",
      name: "Maple Cottage",
      schemeId: "sch-1",
    } as unknown as PropertyItem;

    const unassignedStaff = {
      id: "st-1",
      fullName: "Alex Taylor",
      email: "alex@example.com",
      role: { id: "r-1", name: "Carer" },
      isActive: true,
      schemeId: null,
      propertyId: null,
      assignedWings: [],
      contractedHoursPerWeek: 10,
      createdAt: "",
      updatedAt: "",
    } as unknown as StaffMember;

    expect(resolveStaffLocation(unassignedStaff, [scheme], [property])).toEqual({
      schemeId: null,
      schemeName: null,
      propertyId: null,
      propertyName: null,
    });

    const shift = {
      id: "sh-1",
      wingId: "prop-1",
      startTime: "2026-11-09T08:00:00Z",
      endTime: "2026-11-09T20:00:00Z",
      careType: "1:1 Dedicated Support",
      durationHours: 12,
      actualHoursWorked: 12,
      isCompleted: true,
      userIds: ["st-1"],
      assignments: [{ id: "a-1", userId: "st-1", assignedResidentIds: ["res-1"] }],
    } as unknown as Shift;

    expect(getShiftPlannedHours(shift)).toBe(12);
    expect(getShiftDeliveredHours(shift)).toBe(12);

    const residents = [] as Resident[];
    const metrics = buildHoursSummaryMetrics(70, [shift], [unassignedStaff]);
    expect(metrics.planned).toBe(12);
    expect(metrics.delivered).toBe(12);
    expect(metrics.overtime).toBe(2);
    expect(metrics.gap).toBe(58);

    const rows = buildHoursBreakdownRows({
      viewMode: "both",
      schemeFilter: "all",
      propertyFilter: "all",
      schemes: [scheme],
      properties: [property],
      filteredProperties: [property],
      filteredShifts: [shift],
      residents,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      scheme: "Meadow Scheme",
      property: "Maple Cottage",
      commissioned: 70,
      planned: 12,
      delivered: 12,
      status: "Shortfall",
    });
  });

  it("breaks down care types including 2:1 Support", () => {
    const shift2to1 = {
      id: "sh-2",
      startTime: "2026-11-09T10:00:00Z",
      endTime: "2026-11-09T14:00:00Z",
      careType: "2:1 Dedicated Support",
      durationHours: 4,
    } as unknown as Shift;

    const breakdown = getCareTypeBreakdown([shift2to1]);
    expect(breakdown).toEqual({
      totalHours: 4,
      sharedHours: 0,
      oneToOneHours: 0,
      twoToOneHours: 4,
      sleepInHours: 0,
      wakingNightHours: 0,
    });
  });
});
