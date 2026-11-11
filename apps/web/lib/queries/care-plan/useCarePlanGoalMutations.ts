import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import {
  CREATE_CARE_PLAN_GOAL,
  UPDATE_CARE_PLAN_GOAL,
  DELETE_CARE_PLAN_GOAL,
} from "@repo/endpoints";
import {
  CreateCarePlanGoalDTO,
  UpdateCarePlanGoalDTO,
} from "@repo/schema";
import { carePlanKeys } from "./keys";
import { toast } from "@repo/ui/components/ui";

export function useCreateCarePlanGoalMutation(carePlanId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCarePlanGoalDTO) =>
      makeAPICall(CREATE_CARE_PLAN_GOAL, data, {}, { id: carePlanId }),
    onSuccess: () => {
      toast({ title: "Success", description: "Goal added successfully" });
      queryClient.invalidateQueries({
        queryKey: carePlanKeys.detail(carePlanId),
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add goal",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCarePlanGoalMutation(
  goalId: string,
  carePlanId?: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCarePlanGoalDTO) =>
      makeAPICall(UPDATE_CARE_PLAN_GOAL, data, {}, { goalId }),
    onSuccess: () => {
      toast({ title: "Success", description: "Goal updated successfully" });
      if (carePlanId) {
        queryClient.invalidateQueries({
          queryKey: carePlanKeys.detail(carePlanId),
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update goal",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCarePlanGoalMutation(
  goalId: string,
  carePlanId?: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      makeAPICall(DELETE_CARE_PLAN_GOAL, undefined, {}, { goalId }),
    onSuccess: () => {
      toast({ title: "Success", description: "Goal deleted successfully" });
      if (carePlanId) {
        queryClient.invalidateQueries({
          queryKey: carePlanKeys.detail(carePlanId),
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete goal",
        variant: "destructive",
      });
    },
  });
}
