import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { UPDATE_BED } from "@repo/endpoints";
import { type UpdateBedDTO } from "@repo/schema";

export function useUpdateBedMutationQuery(
  options?: UseMutationOptions<
    any,
    Error,
    { id: string; payload: UpdateBedDTO }
  >,
) {
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateBedDTO;
    }) => {
      return await makeAPICall<any>(UPDATE_BED, payload, {}, { id });
    },
    ...options,
  });
}
