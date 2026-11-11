export const escalationKeys = {
  all: ["escalations"] as const,
  lists: () => [...escalationKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) => [...escalationKeys.lists(), filters] as const,
  details: () => [...escalationKeys.all, "detail"] as const,
  detail: (id: string) => [...escalationKeys.details(), id] as const,
  shiftSummary: (branchId?: string) => [...escalationKeys.all, "shiftSummary", branchId] as const,
};
