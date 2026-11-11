import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_STAFF, GET_STAFF_MEMBER, UPDATE_STAFF_ROLE } from "@repo/endpoints";
import { type UpdateStaffRoleDTO } from "@repo/schema";

export function useUpdateStaffRoleMutationQuery(
  options?: UseMutationOptions<
    any,
    Error,
    { id: string; payload: UpdateStaffRoleDTO }
  >,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      return await makeAPICall<any>(UPDATE_STAFF_ROLE, payload, {}, { id });
    },
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: [GET_STAFF_MEMBER, variables.id] });
      qc.invalidateQueries({ queryKey: [GET_STAFF] });
    },
    ...options,
  });
}
