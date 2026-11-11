import { useQuery, UseQueryOptions, keepPreviousData } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_SCHEMES } from "@repo/endpoints";
import type { SchemeItem } from "../../types/facility";
import type { SchemeListQueryInput, PaginatedResponse } from "@repo/schema";
import { toQueryParams } from "../../utils/queryParams";

export type PaginatedSchemeResponse = PaginatedResponse<SchemeItem>;

export function useGetSchemesQuery(
  branchId?: string | null,
  options?: Partial<UseQueryOptions<SchemeItem[]>>,
) {
  const params: SchemeListQueryInput = {
    all: true,
    ...(branchId ? { branchId } : {}),
  };

  return useQuery({
    queryKey: [GET_SCHEMES, params],
    queryFn: async () => {
      const res = await makeAPICall<PaginatedSchemeResponse | SchemeItem[]>(
        GET_SCHEMES,
        {},
        toQueryParams(params),
      );
      return Array.isArray(res) ? res : res?.data ?? [];
    },
    ...options,
  });
}

export function useGetPaginatedSchemesQuery(
  params: SchemeListQueryInput = { page: 1, limit: 10 },
  options?: Partial<UseQueryOptions<PaginatedSchemeResponse>>,
) {
  return useQuery({
    queryKey: [GET_SCHEMES, "paginated", params],
    queryFn: () =>
      makeAPICall<PaginatedSchemeResponse>(
        GET_SCHEMES,
        {},
        toQueryParams(params),
      ),
    placeholderData: keepPreviousData,
    ...options,
  });
}
