import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { CREATE_TENANT, GET_TENANTS } from "../../endpoints";
import type { SuperAdminCreateTenantDTO } from "@repo/schema";
import type { CreatedTenant } from "../../types/tenant";

export function useCreateTenantMutation(
  options?: UseMutationOptions<
    CreatedTenant,
    Error,
    SuperAdminCreateTenantDTO
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SuperAdminCreateTenantDTO) =>
      makeAPICall<CreatedTenant>(
        CREATE_TENANT,
        payload as unknown as Record<string, unknown>,
      ),
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [GET_TENANTS] });
      options?.onSuccess?.(...args);
    },
  });
}
