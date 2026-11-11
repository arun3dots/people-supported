import { useQuery } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_DAILY_TASKS } from "@repo/endpoints";
import { residentKeys } from "./keys";

export interface DailyTasksFilters {
  date?: string;
  residentId?: string;
  carerId?: string;
  [key: string]: any;
}

export function useGetDailyTasksQuery(filters: DailyTasksFilters = {}) {
  return useQuery({
    queryKey: residentKeys.dailyTasks(filters),
    queryFn: () => makeAPICall<any[]>(GET_DAILY_TASKS, {}, filters),
  });
}
