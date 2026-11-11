import { useQuery } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_CARE_PLAN_DIFF } from "@repo/endpoints";
import { carePlanKeys } from "./keys";

export function useGetCarePlanDiffQuery(id: string, against?: string) {
  return useQuery({
    queryKey: carePlanKeys.diff(id, against),
    queryFn: () =>
      makeAPICall(
        GET_CARE_PLAN_DIFF,
        undefined,
        against ? { against } : {},
        { id }
      ),
    enabled: !!id,
  });
}
