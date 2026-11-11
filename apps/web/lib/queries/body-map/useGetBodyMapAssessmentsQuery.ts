"use client";

import { useQuery } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_BODY_MAP_ASSESSMENTS } from "@repo/endpoints";
import { bodyMapKeys } from "./keys";

export function useGetBodyMapAssessmentsQuery(residentId: string) {
  return useQuery({
    queryKey: bodyMapKeys.assessments(residentId),
    queryFn: async () => {
      return makeAPICall<unknown[]>(
        GET_BODY_MAP_ASSESSMENTS,
        {},
        {},
        { residentId },
      );
    },
    enabled: !!residentId,
  });
}
