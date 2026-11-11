import { getShiftClockInEligibility } from "./shift-timing";
import { getUkDateString } from "./uk-date-time";

describe("getShiftClockInEligibility", () => {
  it("returns canClockIn: false when shift is null or missing startTime", () => {
    expect(getShiftClockInEligibility(null).canClockIn).toBe(false);
    expect(getShiftClockInEligibility({}).canClockIn).toBe(false);
  });

  it("returns canClockIn: false when shift is Draft", () => {
    const today = new Date();
    const result = getShiftClockInEligibility({
      startTime: today.toISOString(),
      status: "Draft",
    });
    expect(result.canClockIn).toBe(false);
    expect(result.isDraft).toBe(true);
  });

  it("returns canClockIn: false when shift is scheduled for tomorrow", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);

    const result = getShiftClockInEligibility({
      startTime: tomorrow.toISOString(),
      status: "Published",
    });
    expect(result.canClockIn).toBe(false);
    expect(result.isToday).toBe(false);
  });

  it("returns canClockIn: false when shift is today but start time has not arrived yet", () => {
    const futureToday = new Date();
    futureToday.setHours(futureToday.getHours() + 2);

    const result = getShiftClockInEligibility({
      startTime: futureToday.toISOString(),
      status: "Published",
    });
    expect(result.canClockIn).toBe(false);
    expect(result.isToday).toBe(true);
    expect(result.isTimeReached).toBe(false);
  });

  it("returns canClockIn: true when shift is today, published, and start time has passed", () => {
    const pastToday = new Date();
    pastToday.setHours(pastToday.getHours() - 1);
    const endToday = new Date();
    endToday.setHours(endToday.getHours() + 8);

    const result = getShiftClockInEligibility({
      startTime: pastToday.toISOString(),
      endTime: endToday.toISOString(),
      status: "Published",
      isStarted: false,
    });
    expect(result.canClockIn).toBe(true);
    expect(result.isToday).toBe(true);
    expect(result.isTimeReached).toBe(true);
  });

  it("returns canClockIn: false when shift has already started", () => {
    const pastToday = new Date();
    pastToday.setHours(pastToday.getHours() - 1);

    const result = getShiftClockInEligibility({
      startTime: pastToday.toISOString(),
      status: "Published",
      isStarted: true,
    });
    expect(result.canClockIn).toBe(false);
    expect(result.isStarted).toBe(true);
  });
});

