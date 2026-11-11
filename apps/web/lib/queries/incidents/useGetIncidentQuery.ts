"use client";

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_INCIDENT } from "@repo/endpoints";
import { Incident } from "../../types/incident";
import { incidentKeys } from "./keys";

export function useGetIncidentQuery(
  id: string,
  options?: Partial<UseQueryOptions<Incident>>,
) {
  return useQuery({
    queryKey: incidentKeys.detail(id),
    queryFn: async () => {
      return await makeAPICall<Incident>(
        GET_INCIDENT,
        {},
        {},
        { id }
      );
    },
    enabled: !!id,
    ...options,
  });
}
