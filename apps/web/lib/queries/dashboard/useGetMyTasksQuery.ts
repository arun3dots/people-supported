import { useQuery } from "@tanstack/react-query";
import { GET_MY_TASKS } from "@repo/endpoints";
import { makeAPICall } from "../../api";

export interface AssignedIncidentTaskItem {
  id: string;
  incidentId: string;
  incidentNumber: string;
  title: string;
  description?: string;
  priority: string;
  dueDate?: string;
  dueTime?: string;
  status: string;
  resident?: { id: string; fullName: string; photoUrl: string | null } | null;
  attachments?: unknown[];
}

export interface MyTasksResponse {
  dailyTasks: any[];
  medicationRounds: any[];
  incidentTasks?: AssignedIncidentTaskItem[];
}

export const useGetMyTasksQuery = () => {
  return useQuery({
    queryKey: ["my-tasks"],
    queryFn: async () => {
      const data = await makeAPICall<MyTasksResponse>(GET_MY_TASKS);
      return data;
    },
    refetchInterval: 60000,
  });
};
