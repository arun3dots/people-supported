import type { Shift } from "../../../../../../lib/types/shifts";
import {
  getShiftPlannedHours,
  getShiftStaffIds,
  roundHours,
} from "./rotaDataUtils";

export interface DayCoverageMetrics {
  activeStaffCount: number;
  totalPlannedHours: number;
  sharedHours: number;
  oneToOneHours: number;
  twoToOneHours: number;
  sleepInCount: number;
  wakingNightCount: number;
  status: "optimal" | "warning" | "gap";
  statusLabel: string;
}

/**
 * Extracts a human-readable, safe error message from an unknown backend or network error.
 */
export function extractErrorMessage(
  err: unknown,
  fallback = "An unexpected error occurred while processing the request.",
): string {
  if (!err) return fallback;
  if (typeof err === "string") return err;

  const anyErr = err as Record<string, unknown>;

  // Check responseData from makeAPICall
  const responseData = anyErr?.responseData as Record<string, unknown> | undefined;
  if (responseData?.message) {
    if (Array.isArray(responseData.message)) {
      return responseData.message.join("; ");
    }
    if (typeof responseData.message === "string") {
      return responseData.message;
    }
  }

  // Check standard data field
  const data = anyErr?.data as Record<string, unknown> | undefined;
  if (data?.message) {
    if (Array.isArray(data.message)) {
      return data.message.join("; ");
    }
    if (typeof data.message === "string") {
      return data.message;
    }
  }

  // Check Error.message
  if (typeof anyErr.message === "string" && anyErr.message.trim()) {
    try {
      const parsed = JSON.parse(anyErr.message);
      if (parsed?.message) {
        return Array.isArray(parsed.message)
          ? parsed.message.join("; ")
          : String(parsed.message);
      }
    } catch {
      // not JSON string
    }
    return anyErr.message;
  }

  return fallback;
}

/**
 * Calculates daily staffing and care coverage metrics for a specific day.
 * Correctly accounts for multi-carer deployments (e.g. 2:1 support or shared core shifts)
 * and excludes "Off / Rest Day" shifts from active duty headcount.
 */
export function computeDailyCoverage(dayShifts: Shift[]): DayCoverageMetrics {
  const activeStaffSet = new Set<string>();
  let totalPlannedHours = 0;
  let sharedHours = 0;
  let oneToOneHours = 0;
  let twoToOneHours = 0;
  let sleepInCount = 0;
  let wakingNightCount = 0;

  dayShifts.forEach((shift) => {
    const careType = shift.careType || "Shared Care (Core Support)";
    const isOff = careType.includes("Off") || careType.includes("Rest");

    // Off / Rest Day shifts indicate staff is NOT on duty; do not count towards care hours or active deployed carers
    if (isOff) {
      return;
    }

    const assignedStaff = getShiftStaffIds(shift);
    assignedStaff.forEach((id) => activeStaffSet.add(id));

    // Multi-carer shifts (e.g. 5 carers on shared shift, or 2 carers on 2:1):
    // Each active carer delivers the shift duration of care/support
    const staffMultiplier = assignedStaff.length > 0 ? assignedStaff.length : 1;
    const baseHours = getShiftPlannedHours(shift);
    const shiftTotalStaffHours = baseHours * staffMultiplier;

    totalPlannedHours += shiftTotalStaffHours;

    if (careType.includes("2:1")) {
      twoToOneHours += shiftTotalStaffHours;
    } else if (careType.includes("1:1")) {
      oneToOneHours += shiftTotalStaffHours;
    } else if (careType.includes("Sleep-in")) {
      sleepInCount += 1;
    } else if (careType.includes("Waking Night")) {
      wakingNightCount += 1;
    } else {
      sharedHours += shiftTotalStaffHours;
    }
  });

  const activeStaffCount = activeStaffSet.size;
  const roundedHours = roundHours(totalPlannedHours);

  let status: "optimal" | "warning" | "gap" = "optimal";
  let statusLabel = "Covered";

  if (activeStaffCount === 0 || roundedHours === 0) {
    status = "gap";
    statusLabel = "GAP (0 Staff)";
  } else if (activeStaffCount === 1) {
    status = "warning";
    statusLabel = "Single Cover";
  } else {
    status = "optimal";
    statusLabel = "Full Cover";
  }

  return {
    activeStaffCount,
    totalPlannedHours: roundedHours,
    sharedHours: roundHours(sharedHours),
    oneToOneHours: roundHours(oneToOneHours),
    twoToOneHours: roundHours(twoToOneHours),
    sleepInCount,
    wakingNightCount,
    status,
    statusLabel,
  };
}

