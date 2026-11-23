import { describe, expect, it } from "vitest";
import {
  medicationDateTimeToIso,
  medicationDateToIso,
} from "./medicationScheduleDates";

describe("saved medication calendar dates", () => {
  it("preserves the entered UK winter time regardless of browser timezone", () => {
    expect(medicationDateTimeToIso("2026-11-13T00:30")).toBe(
      "2026-11-13T00:30:00.000Z",
    );
  });
  it("uses the UK summer offset and preserves the correct clinical day", () => {
    expect(medicationDateTimeToIso("2026-07-13T00:30")).toBe(
      "2026-07-12T23:30:00.000Z",
    );
    expect(medicationDateToIso("2026-07-13")).toBe("2026-07-12T23:00:00.000Z");
  });
  it("rejects missing or invalid dates without substituting a different time", () => {
    expect(() => medicationDateTimeToIso("")).toThrow();
    expect(() => medicationDateTimeToIso("2026-11-13T25:30")).toThrow();
  });
});
