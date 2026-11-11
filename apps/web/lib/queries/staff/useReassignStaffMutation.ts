import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReassignStaffWorkDTO } from "@repo/schema";
import { makeAPICall } from "../../api";
import { GET_STAFF, GET_STAFF_MEMBER, REASSIGN_STAFF, GET_SHIFTS } from "@repo/endpoints";

export function useReassignStaffMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ staffId, data }: { staffId: string; data: ReassignStaffWorkDTO }) =>
      makeAPICall<unknown>(REASSIGN_STAFF, data, {}, { id: staffId }),
    onSuccess: (_, { staffId }) => {
      queryClient.invalidateQueries({ queryKey: [GET_STAFF] });
      queryClient.invalidateQueries({ queryKey: [GET_STAFF_MEMBER, staffId] });
      queryClient.invalidateQueries({ queryKey: [GET_SHIFTS] });
    },
  });
}
