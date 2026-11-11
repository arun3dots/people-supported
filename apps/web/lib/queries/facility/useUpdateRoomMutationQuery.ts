import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { UPDATE_ROOM } from "@repo/endpoints";
import { type UpdateRoomDTO } from "@repo/schema";

export function useUpdateRoomMutationQuery(
  options?: UseMutationOptions<
    any,
    Error,
    { id: string; payload: UpdateRoomDTO }
  >,
) {
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateRoomDTO;
    }) => {
      return await makeAPICall<any>(UPDATE_ROOM, payload, {}, { id });
    },
    ...options,
  });
}
