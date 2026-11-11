import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { CREATE_CARE_PLAN_TASK } from "@repo/endpoints";
import { residentKeys } from "./keys";
import { CreateCarePlanTaskDTO } from "@repo/schema";
import { toast } from "@repo/ui/components/ui";

export function useCreateCarePlanTaskMutation(residentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCarePlanTaskDTO) =>
      makeAPICall(CREATE_CARE_PLAN_TASK, data, {}, { residentId }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Care plan task added successfully",
      });
      queryClient.invalidateQueries({
        queryKey: residentKeys.carePlanTasks(residentId),
      });
      queryClient.invalidateQueries({ queryKey: ["dailyTasks"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add care plan task",
        variant: "destructive",
      });
    },
  });
}
