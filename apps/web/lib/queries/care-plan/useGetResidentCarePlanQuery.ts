import { useQuery } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { carePlanKeys } from "./keys";

export const GET_RESIDENT_CARE_PLAN = "GET_RESIDENT_CARE_PLAN";

export function useGetResidentCarePlanQuery(
  residentId: string,
  asOfDate?: string
) {
  return useQuery({
    queryKey: carePlanKeys.residentAsOf(residentId, asOfDate),
    queryFn: () =>
      makeAPICall(
        GET_RESIDENT_CARE_PLAN,
        undefined,
        asOfDate ? { asOfDate } : {},
        { residentId }
      ),
    enabled: !!residentId,
  });
}
