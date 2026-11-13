"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_COMPLIANCE_REVIEWS } from "@repo/endpoints";
import type {
  ComplianceReviewQueryDTO,
  ComplianceReviewResponseDTO,
} from "@repo/schema";

export function useGetComplianceReviewsQuery(params: Partial<ComplianceReviewQueryDTO> = {}) {
  const queryParams: Record<string, string | number | boolean> = {};

  if (params.days !== undefined) queryParams.days = params.days;
  if (params.category && params.category !== "all") queryParams.category = params.category;
  if (params.search?.trim()) queryParams.search = params.search.trim();
  if (params.page !== undefined) queryParams.page = params.page;
  if (params.limit !== undefined) queryParams.limit = params.limit;

  return useQuery<ComplianceReviewResponseDTO>({
    queryKey: ["compliance-reviews", params],
    queryFn: async () => {
      return makeAPICall<ComplianceReviewResponseDTO>(
        GET_COMPLIANCE_REVIEWS,
        {},
        queryParams,
      );
    },
    placeholderData: keepPreviousData,
  });
}
