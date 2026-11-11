import { useQuery, UseQueryOptions, keepPreviousData } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_WINGS } from "@repo/endpoints";
import { Wing } from "../../types/facility";
import type { WingListQueryInput, PaginatedResponse } from "@repo/schema";
import { toQueryParams } from "../../utils/queryParams";

export type PaginatedWingResponse = PaginatedResponse<Wing>;

/**
 * Every wing as a flat array, for dropdowns, wizards and facility stat cards.
 * Sends `all=true`, so it is NOT affected by list pagination.
 * For the paginated Wings tab use {@link useGetPaginatedWingsQuery}.
 */
export function useGetWingsQuery(
  branchId?: string | null,
  options?: Partial<UseQueryOptions<Wing[]>>,
) {
  const params: WingListQueryInput = { all: true, ...(branchId ? { branchId } : {}) };

  return useQuery({
    queryKey: [GET_WINGS, params],
    queryFn: async () => {
      const res = await makeAPICall<PaginatedWingResponse | Wing[]>(
        GET_WINGS,
        {},
        toQueryParams(params),
      );
      return Array.isArray(res) ? res : res?.data ?? [];
    },
    ...options,
  });
}

/** One page of wings plus the pagination envelope. */
export function useGetPaginatedWingsQuery(
  params: WingListQueryInput = { page: 1, limit: 10 },
  options?: Partial<UseQueryOptions<PaginatedWingResponse>>,
) {
  return useQuery({
    queryKey: [GET_WINGS, "paginated", params],
    queryFn: () =>
      makeAPICall<PaginatedWingResponse>(GET_WINGS, {}, toQueryParams(params)),
    placeholderData: keepPreviousData,
    ...options,
  });
}
