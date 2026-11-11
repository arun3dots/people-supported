import { useQuery } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_RESIDENT_TIMELINE } from "@repo/endpoints";
import { residentKeys } from "./keys";

export function useGetResidentTimelineQuery(residentId: string) {
  return useQuery({
    queryKey: residentKeys.timeline(residentId),
    queryFn: () =>
      makeAPICall<any[]>(GET_RESIDENT_TIMELINE, {}, {}, { id: residentId }),
    enabled: !!residentId,
  });
}
