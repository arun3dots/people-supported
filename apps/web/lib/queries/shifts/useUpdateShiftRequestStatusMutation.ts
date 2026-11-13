import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GET_STAFF } from "@repo/endpoints";
import { makeAPICall } from "../../api";
import { UPDATE_SHIFT_REQUEST_STATUS, GET_SHIFT_REQUESTS } from "@repo/endpoints";

export function useUpdateShiftRequestStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string | null }) => {
      return await makeAPICall(UPDATE_SHIFT_REQUEST_STATUS, { status, adminNotes }, {}, { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GET_SHIFT_REQUESTS] });
      queryClient.invalidateQueries({ queryKey: [GET_STAFF] });
    },
  });
}
