import { useQuery } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_RISK_ASSESSMENTS, GET_RISK_ASSESSMENT } from "@repo/endpoints";
import type { RiskListFilters } from "@repo/schema";
import { riskKeys } from "./keys";
import type { RiskAssessmentResponse } from "./types";

export function useGetRiskAssessmentsQuery(
  filters: RiskListFilters = {},
  options?: { enabled?: boolean; staleTime?: number },
) {
  return useQuery<RiskAssessmentResponse[]>({
    queryKey: riskKeys.assessments(filters),
    queryFn: () =>
      makeAPICall<RiskAssessmentResponse[]>(
        GET_RISK_ASSESSMENTS,
        {},
        filters as Record<string, string | number | boolean>,
      ),
    enabled: options?.enabled,
    staleTime: options?.staleTime ?? 5 * 60 * 1000,
  });
}

export function useGetRiskAssessmentQuery(id: string | undefined) {
  return useQuery<RiskAssessmentResponse>({
    queryKey: riskKeys.assessment(id ?? ""),
    queryFn: () =>
      makeAPICall<RiskAssessmentResponse>(
        GET_RISK_ASSESSMENT,
        {},
        {},
        { id: id ?? "" },
      ),
    enabled: !!id,
  });
}
