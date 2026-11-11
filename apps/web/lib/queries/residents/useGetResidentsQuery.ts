"use client";

import {
  useQuery,
  type UseQueryOptions,
  keepPreviousData,
} from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_RESIDENTS } from "@repo/endpoints";
import type { PaginatedResponse, ResidentListQueryInput } from "@repo/schema";
import { Resident } from "../../types/resident";
import { toQueryParams } from "../../utils/queryParams";
import { residentKeys } from "./keys";

export { residentKeys };

export type PaginatedResidentResponse = PaginatedResponse<Resident>;

/**
 * Every resident as a flat array, for dropdowns, pickers, rota grids and
 * KPI cards. Sends `all=true`, so it is NOT affected by list pagination.
 * For the paginated directory table use {@link useGetPaginatedResidentsQuery}.
 */
export function useGetResidentsQuery(
  filtersOrOptions?:
    | ResidentListQueryInput
    | Partial<UseQueryOptions<Resident[]>>,
  options?: Partial<UseQueryOptions<Resident[]>>,
) {
  const isOptions =
    filtersOrOptions &&
    ("enabled" in filtersOrOptions ||
      "staleTime" in filtersOrOptions ||
      "refetchOnWindowFocus" in filtersOrOptions ||
      "select" in filtersOrOptions);

  const actualFilters: ResidentListQueryInput = isOptions
    ? { all: true }
    : { ...(filtersOrOptions as ResidentListQueryInput), all: true };

  const actualOptions = isOptions
    ? (filtersOrOptions as Partial<UseQueryOptions<Resident[]>>)
    : options;

  return useQuery({
    queryKey: [...residentKeys.lists(), actualFilters],
    queryFn: async () => {
      const res = await makeAPICall<PaginatedResidentResponse | Resident[]>(
        GET_RESIDENTS,
        {},
        toQueryParams(actualFilters),
      );
      return Array.isArray(res) ? res : res?.data ?? [];
    },
    ...actualOptions,
  });
}

/** One page of residents plus the pagination envelope (total, totalPages, ...). */
export function useGetPaginatedResidentsQuery(
  params: ResidentListQueryInput = { page: 1, limit: 10 },
  options?: Partial<UseQueryOptions<PaginatedResidentResponse>>,
) {
  return useQuery({
    queryKey: [...residentKeys.lists(), "paginated", params],
    queryFn: async () =>
      makeAPICall<PaginatedResidentResponse>(
        GET_RESIDENTS,
        {},
        toQueryParams(params),
      ),
    placeholderData: keepPreviousData,
    ...options,
  });
}
