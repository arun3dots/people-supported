"use client";

import { useQuery, type UseQueryOptions, keepPreviousData } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_ALL_CARE_PLANS } from "@repo/endpoints";
import type { CarePlanListQueryInput, PaginatedResponse } from "@repo/schema";
import { toQueryParams } from "../../utils/queryParams";
import { carePlanKeys } from "./keys";
import type { PlanItem } from "../../../app/(protected)/admin/care-plans/components/types";

export type PaginatedCarePlanResponse = PaginatedResponse<PlanItem>;

/**
 * Every care plan as a flat array. Sends `all=true`, so it is NOT affected by list pagination.
 * For the paginated directory table use {@link useGetPaginatedCarePlansQuery}.
 */
export function useGetCarePlansQuery(
  filters?: CarePlanListQueryInput,
  options?: Partial<UseQueryOptions<PlanItem[]>>,
) {
  const params: CarePlanListQueryInput = { ...filters, all: true };

  return useQuery({
    queryKey: [...carePlanKeys.lists(), params],
    queryFn: async () => {
      const res = await makeAPICall<
        PaginatedCarePlanResponse | { plans: PlanItem[] } | PlanItem[]
      >(
        GET_ALL_CARE_PLANS,
        undefined,
        toQueryParams(params),
      );
      if (Array.isArray(res)) return res;
      if (res && "data" in res && Array.isArray(res.data)) return res.data;
      if (res && "plans" in res && Array.isArray(res.plans)) return res.plans;
      return [];
    },
    ...options,
  });
}

/** One page of care plans plus the pagination envelope (total, totalPages, ...). */
export function useGetPaginatedCarePlansQuery(
  params: CarePlanListQueryInput = { page: 1, limit: 10 },
  options?: Partial<UseQueryOptions<PaginatedCarePlanResponse>>,
) {
  return useQuery({
    queryKey: [...carePlanKeys.lists(), "paginated", params],
    queryFn: async () =>
      makeAPICall<PaginatedCarePlanResponse>(
        GET_ALL_CARE_PLANS,
        undefined,
        toQueryParams(params),
      ),
    placeholderData: keepPreviousData,
    ...options,
  });
}
