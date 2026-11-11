import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { CREATE_WING } from "@repo/endpoints";
import { type CreateWingDTO } from "@repo/schema";

export function useCreateWingMutationQuery(
  options?: UseMutationOptions<any, Error, CreateWingDTO>,
) {
  return useMutation({
    mutationFn: async (payload: CreateWingDTO) => {
      return await makeAPICall<any>(CREATE_WING, payload);
    },
    ...options,
  });
}
