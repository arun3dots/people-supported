"use client";

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_CARE_PLAN_METRICS } from "@repo/endpoints";
import type { CarePlanMetricsDTO } from "@repo/schema";

export function useGetCarePlanMetricsQuery(
  options?: Partial<UseQueryOptions<CarePlanMetricsDTO>>,
) {
  return useQuery({
    queryKey: ["care-plans", "metrics"],
    queryFn: async () => {
      return await makeAPICall<CarePlanMetricsDTO>(GET_CARE_PLAN_METRICS);
    },
    ...options,
  });
}

