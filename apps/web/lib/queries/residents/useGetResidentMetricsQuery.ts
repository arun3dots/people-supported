"use client";

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_RESIDENT_METRICS } from "@repo/endpoints";
import { ResidentMetricsDTO } from "@repo/schema";
import { residentKeys } from "./keys";

export function useGetResidentMetricsQuery(
  options?: Partial<UseQueryOptions<ResidentMetricsDTO>>,
) {
  return useQuery({
    queryKey: residentKeys.metrics(),
    queryFn: async () => {
      return await makeAPICall<ResidentMetricsDTO>(GET_RESIDENT_METRICS);
    },
    ...options,
  });
}
