import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import {
  GET_CARER_ASSIGNED_RESIDENT_TASKS,
  UPDATE_DAILY_TASK_STATUS,
} from "@repo/endpoints";
import { toast } from "@repo/ui/components/ui";
import { UpdateDailyTaskStatusDTO } from "@repo/schema";

export function useUpdateDailyTaskStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      data,
    }: {
      taskId: string;
      data: UpdateDailyTaskStatusDTO;
    }) => makeAPICall(UPDATE_DAILY_TASK_STATUS, data, {}, { taskId }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Task status updated",
      });
      queryClient.invalidateQueries({ queryKey: ["dailyTasks"] });
      queryClient.invalidateQueries({
        queryKey: [GET_CARER_ASSIGNED_RESIDENT_TASKS],
      });
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    },
  });
}
