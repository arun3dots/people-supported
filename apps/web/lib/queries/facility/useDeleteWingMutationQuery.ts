import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { DELETE_WING } from "@repo/endpoints";

export function useDeleteWingMutationQuery(
  options?: UseMutationOptions<unknown, Error, string>,
) {
  return useMutation({
    mutationFn: async (id: string) => {
      return await makeAPICall<unknown>(DELETE_WING, {}, {}, { id });
    },
    ...options,
  });
}
