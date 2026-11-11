import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
  MutationFunctionContext,
} from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { ASSIGN_STAFF, GET_ACTIVE_SHIFT, GET_MY_SHIFTS, GET_SHIFTS, GET_RESIDENTS } from "@repo/endpoints";
import { CreateShiftAssignmentDTO } from "@repo/schema";
import { ShiftAssignment } from "../../types/shifts";

export function useAssignStaffMutation(
  options?: UseMutationOptions<ShiftAssignment, Error, CreateShiftAssignmentDTO>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: async (payload: CreateShiftAssignmentDTO) => {
      return await makeAPICall<ShiftAssignment>(ASSIGN_STAFF, payload);
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [GET_MY_SHIFTS] });
      queryClient.invalidateQueries({ queryKey: [GET_ACTIVE_SHIFT] });
      queryClient.invalidateQueries({ queryKey: [GET_SHIFTS] });
      queryClient.invalidateQueries({ queryKey: [GET_RESIDENTS] });
      options?.onSuccess?.(
        data,
        variables,
        undefined,
        context as MutationFunctionContext,
      );
    },
  });
}
