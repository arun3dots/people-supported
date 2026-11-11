import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_MY_SHIFTS } from "@repo/endpoints";
import { Shift } from "../../types/shifts";

export function useGetMyShiftsQuery(
  params: { from?: string; to?: string } = {},
  options?: Partial<UseQueryOptions<Shift[]>>,
) {
  return useQuery({
    queryKey: [GET_MY_SHIFTS, params],
    queryFn: async () => {
      return await makeAPICall<Shift[]>(GET_MY_SHIFTS, {}, params as any);
    },
    ...options,
  });
}
