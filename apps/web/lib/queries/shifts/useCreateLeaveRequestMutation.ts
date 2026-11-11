import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { CREATE_LEAVE_REQUEST, GET_LEAVE_REQUESTS } from "@repo/endpoints";
import { CreateLeaveRequestDTO } from "@repo/schema";
import { LeaveRequestItem } from "./useGetLeaveRequestsQuery";

export function useCreateLeaveRequestMutation(
  options?: UseMutationOptions<LeaveRequestItem, Error, CreateLeaveRequestDTO>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: async (payload: CreateLeaveRequestDTO) => {
      return await makeAPICall<LeaveRequestItem>(CREATE_LEAVE_REQUEST, payload as any);
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [GET_LEAVE_REQUESTS] });
      options?.onSuccess?.(data, variables, context, undefined as any);
    },
  });
}
