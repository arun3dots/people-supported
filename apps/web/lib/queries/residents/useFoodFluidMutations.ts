import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CREATE_FOOD_FLUID_LOG,
  UPDATE_FOOD_FLUID_LOG,
  DELETE_FOOD_FLUID_LOG,
} from "@repo/endpoints";
import type {
  CreateFoodFluidLogDTO,
  UpdateFoodFluidLogDTO,
} from "@repo/schema";
import { makeAPICall } from "../../api";
import type { FoodFluidLogItem } from "./useGetFoodFluidLogsQuery";

export function useCreateFoodFluidLogMutation(residentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFoodFluidLogDTO) =>
      makeAPICall<FoodFluidLogItem>(
        CREATE_FOOD_FLUID_LOG,
        data,
        {},
        { id: residentId },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["residentFoodFluidLogs", residentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["residentFoodFluidSummary", residentId],
      });
    },
  });
}

export function useUpdateFoodFluidLogMutation(residentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      logId,
      data,
    }: {
      logId: string;
      data: UpdateFoodFluidLogDTO;
    }) =>
      makeAPICall<FoodFluidLogItem>(
        UPDATE_FOOD_FLUID_LOG,
        data,
        {},
        { id: residentId, logId },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["residentFoodFluidLogs", residentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["residentFoodFluidSummary", residentId],
      });
    },
  });
}

export function useDeleteFoodFluidLogMutation(residentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (logId: string) =>
      makeAPICall<{ success: boolean }>(
        DELETE_FOOD_FLUID_LOG,
        {},
        {},
        { id: residentId, logId },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["residentFoodFluidLogs", residentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["residentFoodFluidSummary", residentId],
      });
    },
  });
}