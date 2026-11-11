import { useQuery } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_RESIDENT_CARE_PLAN_TASKS } from "@repo/endpoints";
import { residentKeys } from "./keys";

export function useGetResidentCarePlanTasksQuery(residentId: string) {
  return useQuery({
    queryKey: residentKeys.carePlanTasks(residentId),
    queryFn: () =>
      makeAPICall<any[]>(GET_RESIDENT_CARE_PLAN_TASKS, {}, {}, { residentId }),
  });
}
