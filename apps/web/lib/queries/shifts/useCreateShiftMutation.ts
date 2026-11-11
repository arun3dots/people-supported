import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { CREATE_SHIFT, GET_MY_SHIFTS, GET_MY_TASKS, GET_SHIFTS } from "@repo/endpoints";
import { CreateShiftDTO } from "@repo/schema";
import { Shift } from "../../types/shifts";

export function useCreateShiftMutation(
  options?: UseMutationOptions<Shift, Error, CreateShiftDTO>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: async (payload: CreateShiftDTO) => {
      return await makeAPICall<Shift>(CREATE_SHIFT, payload as any);
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [GET_SHIFTS] });
      queryClient.invalidateQueries({ queryKey: [GET_MY_SHIFTS] });
      queryClient.invalidateQueries({ queryKey: [GET_MY_TASKS] });
      options?.onSuccess?.(data, variables, context, undefined as any);
    },
  });
}
