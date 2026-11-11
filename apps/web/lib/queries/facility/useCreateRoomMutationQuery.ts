import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { CREATE_ROOM } from "@repo/endpoints";
import { type CreateRoomDTO } from "@repo/schema";

export function useCreateRoomMutationQuery(
  options?: UseMutationOptions<any, Error, CreateRoomDTO>,
) {
  return useMutation({
    mutationFn: async (payload: CreateRoomDTO) => {
      return await makeAPICall<any>(CREATE_ROOM, payload);
    },
    ...options,
  });
}
