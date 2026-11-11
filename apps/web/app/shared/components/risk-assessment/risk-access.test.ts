import { describe, expect, it } from "vitest";
import { canCreateRiskAssessment } from "./risk-access";

describe("canCreateRiskAssessment", () => {
  it.each(["Carer", "Nurse", "Manager", "Admin", "SuperAdmin"])(
    "allows %s to create assessments, matching the API policy",
    (roleName) => {
      expect(canCreateRiskAssessment(roleName, false, false)).toBe(true);
    },
  );

  it("allows roles with an explicit write permission", () => {
    expect(canCreateRiskAssessment("Auditor", true, false)).toBe(true);
  });

  it("does not allow residents without an explicit write permission", () => {
    expect(canCreateRiskAssessment("Resident", false, false)).toBe(false);
  });

  it("keeps assessment creation disabled for discharged residents", () => {
    expect(canCreateRiskAssessment("Admin", true, true)).toBe(false);
  });
});
