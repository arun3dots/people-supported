import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { DELETE_SHIFT, GET_SHIFTS, GET_MY_SHIFTS } from "@repo/endpoints";

export function useDeleteShiftMutation(
  options?: UseMutationOptions<void, Error, string>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: async (id: string) => {
      return await makeAPICall<void>(
        DELETE_SHIFT,
        undefined,
        {},
        { id }
      );
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [GET_SHIFTS] });
      queryClient.invalidateQueries({ queryKey: [GET_MY_SHIFTS] });
      options?.onSuccess?.(data, variables, context, undefined as never);
    },
  });
}

