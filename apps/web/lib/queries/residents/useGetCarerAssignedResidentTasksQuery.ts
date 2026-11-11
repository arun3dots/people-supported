import { useQuery } from "@tanstack/react-query";
import { GET_CARER_ASSIGNED_RESIDENT_TASKS } from "@repo/endpoints";
import { makeAPICall } from "../../api";

export function useGetCarerAssignedResidentTasksQuery(filters: { date?: string; shiftSlot?: string; residentId?: string } = {}) {
  return useQuery({
    queryKey: [GET_CARER_ASSIGNED_RESIDENT_TASKS, filters],
    queryFn: () => makeAPICall<unknown[]>(GET_CARER_ASSIGNED_RESIDENT_TASKS, {}, filters),
  });
}
