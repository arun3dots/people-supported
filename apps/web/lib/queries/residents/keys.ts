export const residentKeys = {
  all: ["residents"] as const,
  lists: () => [...residentKeys.all, "list"] as const,
  list: (filters: string) => [...residentKeys.lists(), { filters }] as const,
  details: () => [...residentKeys.all, "detail"] as const,
  detail: (id: string) => [...residentKeys.details(), id] as const,
  observations: (id: string) =>
    [...residentKeys.detail(id), "observations"] as const,
  timeline: (id: string) => [...residentKeys.detail(id), "timeline"] as const,
  carePlanTasks: (id: string) =>
    [...residentKeys.detail(id), "carePlanTasks"] as const,
  dailyTasks: (filters: any) => ["dailyTasks", filters] as const,
  metrics: () => [...residentKeys.all, "metrics"] as const,
  insights: () => [...residentKeys.all, "insights"] as const,
};
