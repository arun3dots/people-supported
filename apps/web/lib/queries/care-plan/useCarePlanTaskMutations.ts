import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import {
  CREATE_CARE_PLAN_TASK,
  UPDATE_CARE_PLAN_TASK,
  DELETE_CARE_PLAN_TASK,
  UPDATE_DAILY_TASK_STATUS,
} from "@repo/endpoints";
import {
  CreateCarePlanTaskDTO,
  UpdateCarePlanTaskDTO,
  UpdateDailyTaskStatusDTO,
} from "@repo/schema";
import { carePlanKeys } from "./keys";
import { toast } from "@repo/ui/components/ui";

export function useCreateCarePlanTaskMutation(carePlanId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCarePlanTaskDTO) =>
      makeAPICall(CREATE_CARE_PLAN_TASK, data, {}, { id: carePlanId }),
    onSuccess: () => {
      toast({ title: "Success", description: "Task added successfully" });
      queryClient.invalidateQueries({
        queryKey: carePlanKeys.detail(carePlanId),
      });
      queryClient.invalidateQueries({ queryKey: ["dailyTasks"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add task",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCarePlanTaskMutation(
  taskId: string,
  carePlanId?: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCarePlanTaskDTO) =>
      makeAPICall(UPDATE_CARE_PLAN_TASK, data, {}, { taskId }),
    onSuccess: () => {
      toast({ title: "Success", description: "Task updated successfully" });
      if (carePlanId) {
        queryClient.invalidateQueries({
          queryKey: carePlanKeys.detail(carePlanId),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["dailyTasks"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCarePlanTaskMutation(
  taskId: string,
  carePlanId?: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      makeAPICall(DELETE_CARE_PLAN_TASK, undefined, {}, { taskId }),
    onSuccess: () => {
      toast({ title: "Success", description: "Task deleted successfully" });
      if (carePlanId) {
        queryClient.invalidateQueries({
          queryKey: carePlanKeys.detail(carePlanId),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["dailyTasks"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete task",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateDailyTaskStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      data,
    }: {
      taskId: string;
      data: UpdateDailyTaskStatusDTO;
    }) =>
      makeAPICall(UPDATE_DAILY_TASK_STATUS, data, {}, { taskId }),
    onSuccess: (_, variables) => {
      toast({
        title: "Task Updated",
        description: `Task marked as ${variables.data.status}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["dailyTasks"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update task status",
        variant: "destructive",
      });
    },
  });
}
