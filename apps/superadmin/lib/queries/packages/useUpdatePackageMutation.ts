import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { UPDATE_PACKAGE, GET_PACKAGES } from "../../endpoints";
import type { UpdatePackageDTO } from "@repo/schema";
import type { SubscriptionPackage } from "../../types/package";

export function useUpdatePackageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdatePackageDTO;
    }) =>
      makeAPICall<SubscriptionPackage>(
        UPDATE_PACKAGE,
        payload as unknown as Record<string, unknown>,
        {},
        { id },
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [GET_PACKAGES] }),
  });
}
