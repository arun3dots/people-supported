import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { CREATE_PROPERTY_WITH_ROOMS, UPDATE_PROPERTY } from "@repo/endpoints";
import type {
  CreatePropertyWithRoomsDTO,
  UpdatePropertyDTO,
} from "@repo/schema";
import type { PropertyItem } from "../../types/facility";

export function useCreatePropertyWithRoomsMutation(
  options?: UseMutationOptions<PropertyItem, Error, CreatePropertyWithRoomsDTO>,
) {
  return useMutation({
    mutationFn: async (payload: CreatePropertyWithRoomsDTO) => {
      return await makeAPICall<PropertyItem>(
        CREATE_PROPERTY_WITH_ROOMS,
        payload as unknown as Record<string, unknown>,
      );
    },
    ...options,
  });
}

export function useUpdatePropertyMutation(
  options?: UseMutationOptions<
    PropertyItem,
    Error,
    { id: string; data: UpdatePropertyDTO }
  >,
) {
  return useMutation({
    mutationFn: async ({ id, data }) => {
      return await makeAPICall<PropertyItem>(
        UPDATE_PROPERTY,
        data as unknown as Record<string, unknown>,
        {},
        { id },
      );
    },
    ...options,
  });
}
