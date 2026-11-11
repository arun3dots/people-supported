export const carePlanKeys = {
  all: ["carePlans"] as const,
  lists: () => [...carePlanKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...carePlanKeys.lists(), filters] as const,
  details: () => [...carePlanKeys.all, "detail"] as const,
  detail: (id: string) => [...carePlanKeys.details(), id] as const,
  diff: (id: string, against?: string) =>
    [...carePlanKeys.detail(id), "diff", against] as const,
  resident: (residentId: string) =>
    [...carePlanKeys.all, "resident", residentId] as const,
  residentVersions: (residentId: string) =>
    [...carePlanKeys.resident(residentId), "versions"] as const,
  residentAsOf: (residentId: string, asOfDate?: string) =>
    [...carePlanKeys.resident(residentId), "asOf", asOfDate] as const,
  reviews: (carePlanId: string) =>
    [...carePlanKeys.detail(carePlanId), "reviews"] as const,
  residentReviews: (residentId: string) =>
    [...carePlanKeys.resident(residentId), "reviews"] as const,
  transferPack: (residentId: string) =>
    [...carePlanKeys.all, "transfer-pack", residentId] as const,
  dailyTasks: (filters?: Record<string, unknown>) =>
    ["dailyTasks", filters] as const,
  sections: (carePlanId: string) =>
    [...carePlanKeys.detail(carePlanId), "sections"] as const,
  exportData: (carePlanId: string) =>
    [...carePlanKeys.detail(carePlanId), "exportData"] as const,
};
