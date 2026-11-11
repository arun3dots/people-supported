import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_ACTIVE_SHIFT } from "@repo/endpoints";
import { Shift } from "../../types/shifts";

export interface ActiveShiftResponse {
  active: Shift | null;
  next: Shift | null;
}

export function useGetActiveShiftQuery(
  options?: Partial<UseQueryOptions<ActiveShiftResponse>>,
) {
  return useQuery({
    queryKey: [GET_ACTIVE_SHIFT],
    queryFn: async () => {
      return await makeAPICall<ActiveShiftResponse>(GET_ACTIVE_SHIFT);
    },
    refetchInterval: 1000 * 60, // Refresh every minute
    ...options,
  });
}
