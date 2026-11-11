"use client";

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_ENQUIRY_METRICS } from "@repo/endpoints";
import { EnquiryMetricsDTO } from "@repo/schema";

export function useGetEnquiryMetricsQuery(
  options?: Partial<UseQueryOptions<EnquiryMetricsDTO>>
) {
  return useQuery({
    queryKey: ["enquiries", "metrics"],
    queryFn: async () => {
      return await makeAPICall<EnquiryMetricsDTO>(GET_ENQUIRY_METRICS);
    },
    ...options,
  });
}
