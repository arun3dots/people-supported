import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { CREATE_BED } from "@repo/endpoints";
import { type CreateBedDTO } from "@repo/schema";

export function useCreateBedMutationQuery(
  options?: UseMutationOptions<any, Error, CreateBedDTO>,
) {
  return useMutation({
    mutationFn: async (payload: CreateBedDTO) => {
      return await makeAPICall<any>(CREATE_BED, payload);
    },
    ...options,
  });
}
