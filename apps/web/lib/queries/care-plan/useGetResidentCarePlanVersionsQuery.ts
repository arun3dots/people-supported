import { useQuery } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_RESIDENT_CARE_PLAN_VERSIONS } from "@repo/endpoints";
import { carePlanKeys } from "./keys";

export function useGetResidentCarePlanVersionsQuery(residentId: string) {
  return useQuery({
    queryKey: carePlanKeys.residentVersions(residentId),
    queryFn: () =>
      makeAPICall(
        GET_RESIDENT_CARE_PLAN_VERSIONS,
        undefined,
        {},
        { residentId }
      ),
    enabled: !!residentId,
  });
}
