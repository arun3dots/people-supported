import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { UPDATE_LEAVE_REQUEST_STATUS, GET_LEAVE_REQUESTS } from "@repo/endpoints";
import { UpdateLeaveRequestStatusDTO } from "@repo/schema";
import { LeaveRequestItem } from "./useGetLeaveRequestsQuery";

export function useUpdateLeaveRequestStatusMutation(
  options?: UseMutationOptions<
    LeaveRequestItem,
    Error,
    { id: string; data: UpdateLeaveRequestStatusDTO }
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: async ({ id, data }: { id: string; data: UpdateLeaveRequestStatusDTO }) => {
      return await makeAPICall<LeaveRequestItem>(
        UPDATE_LEAVE_REQUEST_STATUS,
        data as any,
        {},
        { id },
      );
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [GET_LEAVE_REQUESTS] });
      options?.onSuccess?.(data, variables, context, undefined as any);
    },
  });
}
