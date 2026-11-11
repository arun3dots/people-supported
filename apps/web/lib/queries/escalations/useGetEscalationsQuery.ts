"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_ESCALATIONS } from "@repo/endpoints";
import { ClinicalEscalationItemDTO, EscalationQueryParamsDTO } from "@repo/schema";
import { toQueryParams } from "../../utils/queryParams";
import { escalationKeys } from "./keys";

export interface EscalationsResponseEnvelope {
  items: ClinicalEscalationItemDTO[];
  total: number;
  page: number;
  limit: number;
}

export function useGetEscalationsQuery(
  filters?: EscalationQueryParamsDTO,
  options?: Partial<UseQueryOptions<EscalationsResponseEnvelope>>,
) {
  return useQuery({
    queryKey: escalationKeys.list(filters as Record<string, unknown>),
    queryFn: async () => {
      return await makeAPICall<EscalationsResponseEnvelope>(
        GET_ESCALATIONS,
        undefined,
        toQueryParams(filters as Record<string, unknown>),
      );
    },
    ...options,
  });
}
