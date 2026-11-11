"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_ESCALATION_SHIFT_SUMMARY } from "@repo/endpoints";
import { escalationKeys } from "./keys";

export interface ShiftEscalationsSummary {
  totalToday: number;
  openToday: number;
  emergencyCount: number;
  triagedCount: number;
}

export function useGetEscalationShiftSummaryQuery(
  branchId?: string,
  options?: Partial<UseQueryOptions<ShiftEscalationsSummary>>,
) {
  return useQuery({
    queryKey: escalationKeys.shiftSummary(branchId),
    queryFn: async () => {
      return await makeAPICall<ShiftEscalationsSummary>(
        GET_ESCALATION_SHIFT_SUMMARY,
        undefined,
        branchId ? { branchId } : undefined,
      );
    },
    ...options,
  });
}
