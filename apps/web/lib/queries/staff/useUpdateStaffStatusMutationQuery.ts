import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_STAFF, GET_STAFF_MEMBER, UPDATE_STAFF_STATUS } from "@repo/endpoints";
import { type UpdateStaffStatusDTO } from "@repo/schema";

export function useUpdateStaffStatusMutationQuery(
  options?: UseMutationOptions<
    any,
    Error,
    { id: string; payload: UpdateStaffStatusDTO }
  >,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      return await makeAPICall<any>(UPDATE_STAFF_STATUS, payload, {}, { id });
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: [GET_STAFF_MEMBER, variables.id] });
      qc.invalidateQueries({ queryKey: [GET_STAFF] });
    },
    ...options,
  });
}
