import { useQuery, UseQueryOptions, keepPreviousData } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_BEDS } from "@repo/endpoints";
import { Bed } from "../../types/facility";
import type { BedListQueryInput, PaginatedResponse } from "@repo/schema";
import { toQueryParams } from "../../utils/queryParams";

export type PaginatedBedResponse = PaginatedResponse<Bed>;

/**
 * Every bed (optionally scoped to one room) as a flat array, for pickers, the
 * rota and bed-management overview. Sends `all=true`, so it is NOT affected by
 * list pagination. For the Beds tab use {@link useGetPaginatedBedsQuery}.
 */
export function useGetBedsQuery(
  roomId?: string | null,
  options?: Partial<UseQueryOptions<Bed[]>>,
) {
  const params: BedListQueryInput = { all: true, ...(roomId ? { roomId } : {}) };

  return useQuery({
    queryKey: [GET_BEDS, params],
    queryFn: async () => {
      const res = await makeAPICall<PaginatedBedResponse | Bed[]>(
        GET_BEDS,
        {},
        toQueryParams(params),
      );
      return Array.isArray(res) ? res : res?.data ?? [];
    },
    ...options,
  });
}

/** One page of beds plus the pagination envelope. */
export function useGetPaginatedBedsQuery(
  params: BedListQueryInput = { page: 1, limit: 10 },
  options?: Partial<UseQueryOptions<PaginatedBedResponse>>,
) {
  return useQuery({
    queryKey: [GET_BEDS, "paginated", params],
    queryFn: () =>
      makeAPICall<PaginatedBedResponse>(GET_BEDS, {}, toQueryParams(params)),
    placeholderData: keepPreviousData,
    ...options,
  });
}
