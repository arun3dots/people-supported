import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { DELETE_STAFF } from "@repo/endpoints";

export function useDeleteStaffMutationQuery(
  options?: UseMutationOptions<any, Error, string>,
) {
  return useMutation({
    mutationFn: async (id: string) => {
      return await makeAPICall<any>(DELETE_STAFF, {}, {}, { id });
    },
    ...options,
  });
}
