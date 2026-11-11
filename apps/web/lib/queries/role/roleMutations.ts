import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { CREATE_ROLE, UPDATE_ROLE, DELETE_ROLE } from "@repo/endpoints";
import { CreateRoleDTO, UpdateRoleDTO } from "@repo/schema";

export function useCreateRoleMutationQuery(
  options?: UseMutationOptions<any, Error, CreateRoleDTO>,
) {
  return useMutation({
    mutationFn: async (payload: CreateRoleDTO) => {
      return await makeAPICall<any>(CREATE_ROLE, payload);
    },
    ...options,
  });
}

export function useUpdateRoleMutationQuery(
  options?: UseMutationOptions<
    any,
    Error,
    { id: string; payload: UpdateRoleDTO }
  >,
) {
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      return await makeAPICall<any>(UPDATE_ROLE, payload as any, {}, { id });
    },
    ...options,
  });
}

export function useDeleteRoleMutationQuery(
  options?: UseMutationOptions<any, Error, string>,
) {
  return useMutation({
    mutationFn: async (id: string) => {
      return await makeAPICall<any>(DELETE_ROLE, {}, {}, { id });
    },
    ...options,
  });
}
