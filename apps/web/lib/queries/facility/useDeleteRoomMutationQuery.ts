import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { DELETE_ROOM } from "@repo/endpoints";

export function useDeleteRoomMutationQuery(
  options?: UseMutationOptions<unknown, Error, string>,
) {
  return useMutation({
    mutationFn: async (id: string) => {
      return await makeAPICall<unknown>(DELETE_ROOM, {}, {}, { id });
    },
    ...options,
  });
}
