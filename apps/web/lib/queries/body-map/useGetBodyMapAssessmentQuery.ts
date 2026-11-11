"use client";

import { useQuery } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_BODY_MAP_ASSESSMENT } from "@repo/endpoints";
import { bodyMapKeys } from "./keys";

export function useGetBodyMapAssessmentQuery(
  residentId: string,
  assessmentId: string,
) {
  return useQuery({
    queryKey: bodyMapKeys.assessment(assessmentId),
    queryFn: async () => {
      return makeAPICall<unknown>(
        GET_BODY_MAP_ASSESSMENT,
        {},
        {},
        { residentId, id: assessmentId },
      );
    },
    enabled: !!residentId && !!assessmentId,
  });
}
