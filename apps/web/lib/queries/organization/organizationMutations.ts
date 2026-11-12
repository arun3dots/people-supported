import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import {
  GET_ORGANIZATION_PROFILE,
  UPDATE_ORGANIZATION_PROFILE,
  GET_ORGANIZATION_DOCUMENTS,
  UPLOAD_ORGANIZATION_DOCUMENT,
  DELETE_ORGANIZATION_DOCUMENT,
} from "@repo/endpoints";
import { UpdateTenantDTO, TenantDocumentDTO } from "@repo/schema";

export function useUpdateOrganizationProfileMutation(
  options?: UseMutationOptions<unknown, Error, UpdateTenantDTO>,
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options || {};

  return useMutation({
    mutationFn: async (payload: UpdateTenantDTO) => {
      return await makeAPICall<unknown>(
        UPDATE_ORGANIZATION_PROFILE,
        payload as Record<string, unknown>,
      );
    },
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: [GET_ORGANIZATION_PROFILE] });
      onSuccess?.(...args);
    },
    ...restOptions,
  });
}

export function useUploadOrganizationDocumentMutation(
  options?: UseMutationOptions<
    TenantDocumentDTO,
    Error,
    { file: File; category?: string }
  >,
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options || {};

  return useMutation({
    mutationFn: async ({
      file,
      category,
    }: {
      file: File;
      category?: string;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      if (category) {
        formData.append("category", category);
      }

      return await makeAPICall<TenantDocumentDTO>(
        UPLOAD_ORGANIZATION_DOCUMENT,
        formData,
      );
    },
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: [GET_ORGANIZATION_DOCUMENTS] });
      onSuccess?.(...args);
    },
    ...restOptions,
  });
}

export function useDeleteOrganizationDocumentMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, string>,
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options || {};

  return useMutation({
    mutationFn: async (id: string) => {
      return await makeAPICall<{ success: boolean }>(
        DELETE_ORGANIZATION_DOCUMENT,
        {},
        {},
        { id },
      );
    },
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: [GET_ORGANIZATION_DOCUMENTS] });
      onSuccess?.(...args);
    },
    ...restOptions,
  });
}

