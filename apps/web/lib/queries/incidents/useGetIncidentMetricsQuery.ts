"use client";

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_INCIDENT_METRICS } from "@repo/endpoints";
import { IncidentMetrics } from "../../types/incident";
import { incidentKeys } from "./keys";

export function useGetIncidentMetricsQuery(
  options?: Partial<UseQueryOptions<IncidentMetrics>>,
) {
  return useQuery({
    queryKey: incidentKeys.metrics(),
    queryFn: async () => {
      return await makeAPICall<IncidentMetrics>(GET_INCIDENT_METRICS);
    },
    ...options,
  });
}
