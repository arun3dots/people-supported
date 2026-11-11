export const bodyMapKeys = {
  all: ["bodyMap"] as const,
  assessments: (residentId: string) =>
    [...bodyMapKeys.all, residentId, "assessments"] as const,
  assessment: (id: string) =>
    [...bodyMapKeys.all, "assessment", id] as const,
};
