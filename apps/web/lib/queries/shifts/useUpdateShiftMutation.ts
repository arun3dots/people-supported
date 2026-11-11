import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { UPDATE_SHIFT, GET_MY_SHIFTS, GET_MY_TASKS, GET_SHIFTS, GET_RESIDENTS } from "@repo/endpoints";
import { ShiftDTO, UpdateShiftDTO } from "@repo/schema";
import { Shift } from "../../types/shifts";

export function useUpdateShiftMutation(
  options?: UseMutationOptions<Shift, Error, UpdateShiftDTO & { id: string }>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: async ({ id, ...payload }: UpdateShiftDTO & { id: string }) => {
      return await makeAPICall<Shift>(
        UPDATE_SHIFT, 
        payload as any, 
        {}, 
        { id }
      );
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [GET_SHIFTS] });
      queryClient.invalidateQueries({ queryKey: [GET_MY_SHIFTS] });
      queryClient.invalidateQueries({ queryKey: [GET_MY_TASKS] });
      queryClient.invalidateQueries({ queryKey: [GET_RESIDENTS] });
      options?.onSuccess?.(data, variables, context, undefined as any);
    },
  });
}
