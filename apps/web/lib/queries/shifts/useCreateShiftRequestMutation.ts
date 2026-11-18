import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GET_STAFF } from "@repo/endpoints";
import { makeAPICall } from "../../api";
import { CREATE_SHIFT_REQUEST, GET_SHIFT_REQUESTS } from "@repo/endpoints";
import { CreateShiftRequestDTO } from "@repo/schema";

export function useCreateShiftRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateShiftRequestDTO) => {
      return await makeAPICall(CREATE_SHIFT_REQUEST, data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GET_SHIFT_REQUESTS] });
      queryClient.invalidateQueries({ queryKey: [GET_STAFF] });
    },
  });
}
