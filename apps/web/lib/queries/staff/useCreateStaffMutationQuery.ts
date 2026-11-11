import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { CREATE_STAFF } from "@repo/endpoints";
import { type CreateStaffDTO } from "@repo/schema";

export function useCreateStaffMutationQuery(
  options?: UseMutationOptions<any, Error, CreateStaffDTO>,
) {
  return useMutation({
    mutationFn: async (payload: CreateStaffDTO) => {
      return await makeAPICall<any>(CREATE_STAFF, payload);
    },
    ...options,
  });
}
