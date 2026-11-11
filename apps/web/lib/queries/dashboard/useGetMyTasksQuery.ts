import { useQuery } from "@tanstack/react-query";

import { GET_MY_TASKS } from "@repo/endpoints";
import { makeAPICall } from "../../api";

interface MyTasksResponse {
  dailyTasks: any[];
  medicationRounds: any[];
}

export const useGetMyTasksQuery = () => {
  return useQuery({
    queryKey: ["my-tasks"],
    queryFn: async () => {
      const data = await makeAPICall<MyTasksResponse>(GET_MY_TASKS);
      return data;
    },
    refetchInterval: 60000, // Refetch every minute for real-time feel
  });
};
