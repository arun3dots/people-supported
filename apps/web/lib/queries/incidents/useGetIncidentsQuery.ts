"use client";

import { useQuery, type UseQueryOptions, keepPreviousData } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_INCIDENTS } from "@repo/endpoints";
import { Incident } from "../../types/incident";
import type { IncidentListQueryInput, PaginatedResponse } from "@repo/schema";
import { toQueryParams } from "../../utils/queryParams";
import { incidentKeys } from "./keys";

export interface GetIncidentsParams {
  search?: string;
  status?: string;
  priority?: string;
  category?: string;
}
export type PaginatedIncidentResponse = PaginatedResponse<Incident>;

/**
 * Every incident as a flat array. Sends `all=true`, so it is NOT affected by list pagination.
 * For the paginated directory table use {@link useGetPaginatedIncidentsQuery}.
 */
export function useGetIncidentsQuery(
  filters?: IncidentListQueryInput,
  options?: Partial<UseQueryOptions<Incident[]>>,
) {
  const params: IncidentListQueryInput = { ...filters, all: true };

  return useQuery({
    queryKey: [...incidentKeys.lists(), params],
    queryFn: async () => {
      const res = await makeAPICall<PaginatedIncidentResponse | Incident[]>(
        GET_INCIDENTS,
        undefined,
        toQueryParams(params),
      );
      return Array.isArray(res) ? res : res?.data ?? [];
    },
    ...options,
  });
}

/** One page of incidents plus the pagination envelope (total, totalPages, ...). */
export function useGetPaginatedIncidentsQuery(
  params: IncidentListQueryInput = { page: 1, limit: 10 },
  options?: Partial<UseQueryOptions<PaginatedIncidentResponse>>,
) {
  return useQuery({
    queryKey: [...incidentKeys.lists(), "paginated", params],
    queryFn: async () =>
      makeAPICall<PaginatedIncidentResponse>(
        GET_INCIDENTS,
        undefined,
        toQueryParams(params),
      ),
    placeholderData: keepPreviousData,
    ...options,
  });
}
