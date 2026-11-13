export const careJourneyKeys = {
  all: ["care-journey"] as const,
  assessment: (residentId: string) =>
    [...careJourneyKeys.all, "assessment", residentId] as const,
  plans: (residentId: string) =>
    [...careJourneyKeys.all, "plans", residentId] as const,
  definitions: (residentId: string) =>
    [...careJourneyKeys.all, "definitions", residentId] as const,
  board: (date: string) => [...careJourneyKeys.all, "board", date] as const,
  boardAll: ["care-journey", "board"] as const,
  day: (residentId: string, shift: string, date?: string) =>
    [
      ...careJourneyKeys.all,
      "day",
      residentId,
      shift,
      date ?? "today",
    ] as const,
  dayAll: (residentId: string) =>
    [...careJourneyKeys.all, "day", residentId] as const,
};
