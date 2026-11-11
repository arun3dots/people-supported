import { describe, expect, it } from "vitest";
import {
  addUkCalendarDays,
  createUkDateTime,
  convertLocalDateTimeToUk,
  formatUkTime,
  getUkDateString,
  getUkDayStart,
  getUkDateTimeForLocalDisplay,
} from "./uk-date-time";

describe("UK schedule date and time utilities", () => {
  it("converts UK wall-clock times without using the device timezone", () => {
    expect(createUkDateTime("2026-10-26", "16:30").toISOString()).toBe(
      "2026-10-26T16:30:00.000Z",
    );
    expect(createUkDateTime("2026-07-26", "16:30").toISOString()).toBe(
      "2026-07-26T15:30:00.000Z",
    );
  });

  it("formats stored timestamps using UK local time", () => {
    expect(formatUkTime("2026-10-26T16:30:00.000Z")).toBe("16:30");
    expect(getUkDateString("2026-10-26T23:30:00.000Z")).toBe("2026-10-26");
    expect(getUkDateString("2026-10-27T00:30:00.000Z")).toBe("2026-10-27");
  });

  it("round-trips the DateTimePicker's local Date through UK wall time", () => {
    const instant = createUkDateTime("2026-07-26", "16:30");
    const displayedValue = getUkDateTimeForLocalDisplay(instant);

    expect(displayedValue.getHours()).toBe(16);
    expect(displayedValue.getMinutes()).toBe(30);
    expect(convertLocalDateTimeToUk(displayedValue).toISOString()).toBe(
      instant.toISOString(),
    );
  });

  it("creates UK day boundaries and advances overnight dates", () => {
    expect(getUkDayStart("2026-07-26T12:00:00.000Z").toISOString()).toBe(
      "2026-07-25T23:00:00.000Z",
    );
    const overnightEnd = addUkCalendarDays(
      createUkDateTime("2026-10-26", "02:30"),
      1,
    );
    expect(getUkDateString(overnightEnd)).toBe("2026-10-27");
    expect(formatUkTime(overnightEnd)).toBe("02:30");
  });

  it("rejects UK wall-clock times skipped by the spring DST transition", () => {
    expect(() => createUkDateTime("2026-03-29", "01:30")).toThrow(
      "daylight-saving transition",
    );
  });

  it("uses the standard-time occurrence for a repeated autumn clock time", () => {
    expect(createUkDateTime("2026-10-25", "01:30").toISOString()).toBe(
      "2026-10-25T01:30:00.000Z",
    );
  });
});
