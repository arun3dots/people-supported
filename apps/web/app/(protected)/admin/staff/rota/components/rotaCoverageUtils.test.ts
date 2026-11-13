import { describe, expect, it } from "vitest";
import type { Shift } from "../../../../../../lib/types/shifts";
import {
  computeDailyCoverage,
  extractErrorMessage,
} from "./rotaCoverageUtils";

describe("rotaCoverageUtils", () => {
  describe("extractErrorMessage", () => {
    it("returns fallback for null or empty errors", () => {
      expect(extractErrorMessage(null)).toBe(
        "An unexpected error occurred while processing the request.",
      );
      expect(extractErrorMessage(undefined, "Custom fallback")).toBe(
        "Custom fallback",
      );
    });

    it("returns plain string directly", () => {
      expect(extractErrorMessage("Direct error message")).toBe(
        "Direct error message",
      );
    });

    it("extracts message from responseData string or array", () => {
      const errWithString = {
        responseData: { message: "A staff member is already assigned to an overlapping shift." },
      };
      expect(extractErrorMessage(errWithString)).toBe(
        "A staff member is already assigned to an overlapping shift.",
      );

      const errWithArray = {
        responseData: { message: ["Field 1 is required", "Field 2 is invalid"] },
      };
      expect(extractErrorMessage(errWithArray)).toBe(
        "Field 1 is required; Field 2 is invalid",
      );
    });

    it("parses stringified JSON inside error message", () => {
      const err = new Error(
        JSON.stringify({ message: "Safeguarding restriction applied" }),
      );
      expect(extractErrorMessage(err)).toBe("Safeguarding restriction applied");
    });
  });

  describe("computeDailyCoverage", () => {
    it("identifies GAP when no shifts are scheduled", () => {
      const result = computeDailyCoverage([]);
      expect(result.status).toBe("gap");
      expect(result.activeStaffCount).toBe(0);
      expect(result.totalPlannedHours).toBe(0);
      expect(result.statusLabel).toBe("GAP (0 Staff)");
    });

    it("identifies warning when only single carer is on duty", () => {
      const mockShift: Shift = {
        id: "shift-1",
        branchId: "branch-1",
        careType: "Shared Care (Core Support)",
        startTime: new Date("2026-11-13T08:00:00Z"),
        endTime: new Date("2026-11-13T16:00:00Z"),
        durationHours: 8,
        userIds: ["staff-1"],
      };

      const result = computeDailyCoverage([mockShift]);
      expect(result.status).toBe("warning");
      expect(result.activeStaffCount).toBe(1);
      expect(result.totalPlannedHours).toBe(8);
      expect(result.statusLabel).toBe("Single Cover");
    });

    it("excludes Off / Rest Day shifts from active staff count and total hours", () => {
      const mockShifts: Shift[] = [
        {
          id: "shift-active",
          branchId: "branch-1",
          careType: "Shared Care (Core Support)",
          startTime: new Date("2026-11-12T08:00:00Z"),
          endTime: new Date("2026-11-12T16:00:00Z"),
          durationHours: 8,
          userIds: ["carer-1"],
        },
        {
          id: "shift-off-1",
          branchId: "branch-1",
          careType: "Off / Rest Day",
          startTime: new Date("2026-11-12T08:00:00Z"),
          endTime: new Date("2026-11-12T16:00:00Z"),
          durationHours: 0,
          userIds: ["carer-2"],
        },
        {
          id: "shift-off-2",
          branchId: "branch-1",
          careType: "Off / Rest Day",
          startTime: new Date("2026-11-12T08:00:00Z"),
          endTime: new Date("2026-11-12T16:00:00Z"),
          durationHours: 0,
          userIds: ["carer-3"],
        },
      ];

      const result = computeDailyCoverage(mockShifts);
      expect(result.status).toBe("warning");
      expect(result.activeStaffCount).toBe(1);
      expect(result.totalPlannedHours).toBe(8);
      expect(result.statusLabel).toBe("Single Cover");
    });

    it("correctly calculates total carer hours for multi-staff shared shifts", () => {
      const mockMultiStaffShift: Shift = {
        id: "shift-multi",
        branchId: "branch-1",
        careType: "Shared Care (Core Support)",
        startTime: new Date("2026-11-09T08:00:00Z"),
        endTime: new Date("2026-11-09T14:00:00Z"),
        durationHours: 6,
        userIds: ["staff-1", "staff-2", "staff-3", "staff-4", "staff-5"],
      };

      const result = computeDailyCoverage([mockMultiStaffShift]);
      expect(result.status).toBe("optimal");
      expect(result.activeStaffCount).toBe(5);
      expect(result.totalPlannedHours).toBe(30); // 6h * 5 staff
      expect(result.statusLabel).toBe("Full Cover");
    });
  });
});

