import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { CREATE_PACKAGE, GET_PACKAGES } from "../../endpoints";
import type { CreatePackageDTO } from "@repo/schema";
import type { SubscriptionPackage } from "../../types/package";

export function useCreatePackageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreatePackageDTO) =>
      makeAPICall<SubscriptionPackage>(
        CREATE_PACKAGE,
        payload as unknown as Record<string, unknown>,
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [GET_PACKAGES] }),
  });
}
