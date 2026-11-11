import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { UPDATE_HANDOVER_NOTES, GET_ACTIVE_SHIFT, GET_MY_SHIFTS, GET_SHIFT_DETAILS } from "@repo/endpoints";

export interface UpdateHandoverNotesPayload {
  shiftId: string;
  handoverNotes: string;
}

export function useUpdateHandoverNotesMutation(
  options?: UseMutationOptions<unknown, Error, UpdateHandoverNotesPayload>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shiftId, handoverNotes }: UpdateHandoverNotesPayload) => {
      return await makeAPICall<unknown>(
        UPDATE_HANDOVER_NOTES,
        { handoverNotes },
        undefined,
        { id: shiftId }
      );
    },
    onSuccess: (data, variables, context) => {
      void queryClient.invalidateQueries({ queryKey: [GET_ACTIVE_SHIFT] });
      void queryClient.invalidateQueries({ queryKey: [GET_MY_SHIFTS] });
      void queryClient.invalidateQueries({ queryKey: [GET_SHIFT_DETAILS, variables.shiftId] });
      options?.onSuccess?.(data, variables, context, undefined as never);
    },
    ...options,
  });
}
