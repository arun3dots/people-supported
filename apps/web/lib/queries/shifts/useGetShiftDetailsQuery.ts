import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_SHIFT_DETAILS } from "@repo/endpoints";
import { ShiftDetailsResponseDTO } from "@repo/schema";

export function useGetShiftDetailsQuery(
  shiftId: string,
  options?: Omit<UseQueryOptions<ShiftDetailsResponseDTO, Error>, "queryKey" | "queryFn">
) {
  return useQuery<ShiftDetailsResponseDTO, Error>({
    queryKey: [GET_SHIFT_DETAILS, shiftId],
    queryFn: async () => {
      return await makeAPICall<ShiftDetailsResponseDTO>(
        GET_SHIFT_DETAILS,
        undefined,
        undefined,
        { id: shiftId }
      );
    },
    enabled: Boolean(shiftId),
    ...options,
  });
}
