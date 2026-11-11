import { useMutation, useQueryClient } from "@tanstack/react-query";

import { UpdateStaffDTO } from "@repo/schema";
import { makeAPICall } from "../../api";
import {
  GET_STAFF_MEMBER,
  GET_STAFF,
  UPDATE_STAFF,
  GET_STAFF_COMPLIANCE,
  GET_STAFF_DBS,
  GET_STAFF_HEALTH,
  GET_STAFF_CERTIFICATIONS,
} from "@repo/endpoints";

export function useUpdateStaffMutation(staffId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateStaffDTO) =>
      makeAPICall<any>(UPDATE_STAFF, payload, {}, { id: staffId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GET_STAFF_MEMBER, staffId] });
      queryClient.invalidateQueries({ queryKey: [GET_STAFF_COMPLIANCE, staffId] });
      queryClient.invalidateQueries({ queryKey: [GET_STAFF_DBS, staffId] });
      queryClient.invalidateQueries({ queryKey: [GET_STAFF_HEALTH, staffId] });
      queryClient.invalidateQueries({ queryKey: [GET_STAFF_CERTIFICATIONS, staffId] });
      queryClient.invalidateQueries({ queryKey: [GET_STAFF] });
    },
  });
}
