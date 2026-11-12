import { useQuery, UseQueryOptions, keepPreviousData } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_PROPERTIES } from "@repo/endpoints";
import type { PropertyItem } from "../../types/facility";
import type { WingListQueryInput, PaginatedResponse } from "@repo/schema";
import { toQueryParams } from "../../utils/queryParams";

export type PaginatedPropertyResponse = PaginatedResponse<PropertyItem>;

export function useGetPropertiesQuery(
  branchId?: string | null,
  options?: Partial<UseQueryOptions<PropertyItem[]>>,
  status?: string,
) {
  const params: WingListQueryInput = {
    all: true,
    ...(branchId ? { branchId } : {}),
    ...(status ? { status } : {}),
  };

  return useQuery({
    queryKey: [GET_PROPERTIES, params],
    queryFn: async () => {
      const res = await makeAPICall<PaginatedPropertyResponse | PropertyItem[]>(
        GET_PROPERTIES,
        {},
        toQueryParams(params),
      );
      return Array.isArray(res) ? res : res?.data ?? [];
    },
    ...options,
  });
}

export function useGetPaginatedPropertiesQuery(
  params: WingListQueryInput = { page: 1, limit: 10 },
  options?: Partial<UseQueryOptions<PaginatedPropertyResponse>>,
) {
  return useQuery({
    queryKey: [GET_PROPERTIES, "paginated", params],
    queryFn: () =>
      makeAPICall<PaginatedPropertyResponse>(
        GET_PROPERTIES,
        {},
        toQueryParams(params),
      ),
    placeholderData: keepPreviousData,
    ...options,
  });
}
