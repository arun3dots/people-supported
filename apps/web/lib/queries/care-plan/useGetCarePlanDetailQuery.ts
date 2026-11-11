import { useQuery } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_CARE_PLAN_DETAIL } from "@repo/endpoints";
import { carePlanKeys } from "./keys";

export function useGetCarePlanDetailQuery(id: string) {
  return useQuery({
    queryKey: carePlanKeys.detail(id),
    queryFn: () => makeAPICall(GET_CARE_PLAN_DETAIL, undefined, {}, { id }),
    enabled: !!id,
  });
}
