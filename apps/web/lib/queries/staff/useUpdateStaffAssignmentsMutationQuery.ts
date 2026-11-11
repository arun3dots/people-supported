import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_STAFF, GET_STAFF_MEMBER, UPDATE_STAFF_ASSIGNMENTS } from "@repo/endpoints";
import { UpdateStaffAssignmentsDTO } from "@repo/schema";

export function useUpdateStaffAssignmentsMutationQuery(
  options?: UseMutationOptions<
    any,
    Error,
    { id: string; payload: UpdateStaffAssignmentsDTO }
  >,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      return await makeAPICall<any>(
        UPDATE_STAFF_ASSIGNMENTS,
        payload as any,
        {},
        { id },
      );
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: [GET_STAFF_MEMBER, variables.id] });
      qc.invalidateQueries({ queryKey: [GET_STAFF] });
    },
    ...options,
  });
}
