"use client";

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_RESIDENT_INSIGHTS } from "@repo/endpoints";
import { ResidentInsightsDTO } from "@repo/schema";
import { residentKeys } from "./keys";

export function useGetResidentInsightsQuery(
  options?: Partial<UseQueryOptions<ResidentInsightsDTO>>,
) {
  return useQuery({
    queryKey: residentKeys.insights(),
    queryFn: async () => {
      return await makeAPICall<ResidentInsightsDTO>(GET_RESIDENT_INSIGHTS);
    },
    ...options,
  });
}
