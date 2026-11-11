import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { END_SHIFT, GET_ACTIVE_SHIFT, GET_MY_SHIFTS, GET_SHIFTS, GET_SHIFT_DETAILS } from "@repo/endpoints";

export interface EndShiftPayload {
  shiftId: string;
  handoverNotes?: string;
  tasksCompleted?: number;
  tasksTotal?: number;
}

export function useEndShiftMutation(
  options?: UseMutationOptions<unknown, Error, EndShiftPayload>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shiftId, handoverNotes, tasksCompleted, tasksTotal }: EndShiftPayload) => {
      return await makeAPICall<unknown>(
        END_SHIFT,
        { handoverNotes, tasksCompleted, tasksTotal },
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
