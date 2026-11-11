import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { START_SHIFT, GET_ACTIVE_SHIFT, GET_MY_SHIFTS, GET_SHIFTS, GET_SHIFT_DETAILS } from "@repo/endpoints";

export interface StartShiftPayload {
  shiftId: string;
  notes?: string;
}

export function useStartShiftMutation(
  options?: UseMutationOptions<unknown, Error, StartShiftPayload>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shiftId, notes }: StartShiftPayload) => {
      return await makeAPICall<unknown>(
        START_SHIFT,
        { notes },
        undefined,
        { id: shiftId }
      );
    },
    onSuccess: (data, variables, context) => {
      void queryClient.invalidateQueries({ queryKey: [GET_ACTIVE_SHIFT] });
      void queryClient.invalidateQueries({ queryKey: [GET_MY_SHIFTS] });
      void queryClient.invalidateQueries({ queryKey: [GET_SHIFTS] });
      void queryClient.invalidateQueries({ queryKey: [GET_SHIFT_DETAILS, variables.shiftId] });
      options?.onSuccess?.(data, variables, context, undefined as never);
    },
    ...options,
  });
}
