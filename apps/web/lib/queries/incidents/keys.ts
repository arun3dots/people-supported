export const incidentKeys = {
  all: ["incidents"] as const,
  lists: () => [...incidentKeys.all, "list"] as const,
  list: (filters: string) => [...incidentKeys.lists(), { filters }] as const,
  details: () => [...incidentKeys.all, "detail"] as const,
  detail: (id: string) => [...incidentKeys.details(), id] as const,
  metrics: () => [...incidentKeys.all, "metrics"] as const,
};
