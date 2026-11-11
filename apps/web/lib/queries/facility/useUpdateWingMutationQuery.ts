import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { UPDATE_WING } from "@repo/endpoints";
import { type UpdateWingDTO } from "@repo/schema";

export function useUpdateWingMutationQuery(
  options?: UseMutationOptions<
    any,
    Error,
    { id: string; payload: UpdateWingDTO }
  >,
) {
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateWingDTO;
    }) => {
      return await makeAPICall<any>(UPDATE_WING, payload, {}, { id });
    },
    ...options,
  });
}
