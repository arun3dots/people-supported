import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { DELETE_BED } from "@repo/endpoints";

export function useDeleteBedMutationQuery(
  options?: UseMutationOptions<unknown, Error, string>,
) {
  return useMutation({
    mutationFn: async (id: string) => {
      return await makeAPICall<unknown>(DELETE_BED, {}, {}, { id });
    },
    ...options,
  });
}
