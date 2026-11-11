import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_SHIFT_TYPES } from "@repo/endpoints";
import { ShiftType } from "../../types/shifts";

export function useGetShiftTypesQuery(
  options?: Partial<UseQueryOptions<ShiftType[]>>,
) {
  return useQuery({
    queryKey: [GET_SHIFT_TYPES],
    queryFn: async () => {
      return await makeAPICall<ShiftType[]>(GET_SHIFT_TYPES);
    },
    ...options,
  });
}
