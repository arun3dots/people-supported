import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_SHIFTS } from "@repo/endpoints";
import { Shift } from "../../types/shifts";

export function useGetShiftsQuery(
  params: { from?: string; to?: string; wingId?: string; unitId?: string } = {},
  options?: Partial<UseQueryOptions<Shift[]>>,
) {
  return useQuery({
    queryKey: [GET_SHIFTS, params],
    queryFn: async () => {
      return await makeAPICall<Shift[]>(GET_SHIFTS, {}, params as any);
    },
    ...options,
  });
}
