import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { CREATE_SCHEME, UPDATE_SCHEME, DELETE_SCHEME } from "@repo/endpoints";
import type { CreateSchemeDTO, UpdateSchemeDTO } from "@repo/schema";
import type { SchemeItem } from "../../types/facility";

export function useCreateSchemeMutation(
  options?: UseMutationOptions<SchemeItem, Error, CreateSchemeDTO>,
) {
  return useMutation({
    mutationFn: async (payload: CreateSchemeDTO) => {
      return await makeAPICall<SchemeItem>(
        CREATE_SCHEME,
        payload as unknown as Record<string, unknown>,
      );
    },
    ...options,
  });
}

export function useUpdateSchemeMutation(
  options?: UseMutationOptions<
    SchemeItem,
    Error,
    { id: string; data: UpdateSchemeDTO }
  >,
) {
  return useMutation({
    mutationFn: async ({ id, data }) => {
      return await makeAPICall<SchemeItem>(
        UPDATE_SCHEME,
        data as unknown as Record<string, unknown>,
        {},
        { id },
      );
    },
    ...options,
  });
}

export function useDeleteSchemeMutation(
  options?: UseMutationOptions<void, Error, string>,
) {
  return useMutation({
    mutationFn: async (id: string) => {
      return await makeAPICall<void>(DELETE_SCHEME, {}, {}, { id });
    },
    ...options,
  });
}
