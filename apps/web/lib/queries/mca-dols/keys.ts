export const mcaDolsKeys = {
  all: ["mca-dols"] as const,
  assessments: () => [...mcaDolsKeys.all, "assessments"] as const,
  residentAssessments: (residentId: string) =>
    [...mcaDolsKeys.assessments(), "resident", residentId] as const,
  assessmentDetail: (id: string) =>
    [...mcaDolsKeys.assessments(), "detail", id] as const,
  dols: () => [...mcaDolsKeys.all, "dols"] as const,
  residentDols: (residentId: string) =>
    [...mcaDolsKeys.dols(), "resident", residentId] as const,
  dolsDetail: (id: string) =>
    [...mcaDolsKeys.dols(), "detail", id] as const,
  expiringDols: (daysAhead?: number) =>
    [...mcaDolsKeys.dols(), "expiring", daysAhead] as const,
};
