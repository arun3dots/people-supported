import { useQuery } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_RESIDENT_OBSERVATIONS } from "@repo/endpoints";
import { residentKeys } from "./keys";

export function useGetResidentObservationsQuery(residentId: string) {
  return useQuery({
    queryKey: residentKeys.observations(residentId),
    queryFn: () =>
      makeAPICall<any[]>(GET_RESIDENT_OBSERVATIONS, {}, {}, { residentId }),
    enabled: !!residentId,
  });
}
