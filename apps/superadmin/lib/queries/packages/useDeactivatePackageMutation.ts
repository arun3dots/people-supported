import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { DEACTIVATE_PACKAGE, GET_PACKAGES } from "../../endpoints";
import type { SubscriptionPackage } from "../../types/package";

export function useDeactivatePackageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      makeAPICall<SubscriptionPackage>(DEACTIVATE_PACKAGE, {}, {}, { id }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [GET_PACKAGES] }),
  });
}
