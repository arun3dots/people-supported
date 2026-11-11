import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_SHIFT_REQUESTS } from "@repo/endpoints";
import { ShiftRequest } from "../../types/shifts";

export function useGetShiftRequestsQuery(
  options?: Partial<UseQueryOptions<ShiftRequest[]>>,
) {
  return useQuery({
    queryKey: [GET_SHIFT_REQUESTS],
    queryFn: async () => {
      return await makeAPICall<ShiftRequest[]>(GET_SHIFT_REQUESTS);
    },
    ...options,
  });
}
