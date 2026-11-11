import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_PACKAGES } from "../../endpoints";
import type { SubscriptionPackage } from "../../types/package";

export function useGetPackagesQuery(
  options?: Partial<UseQueryOptions<SubscriptionPackage[]>>,
) {
  return useQuery({
    queryKey: [GET_PACKAGES],
    queryFn: async () => makeAPICall<SubscriptionPackage[]>(GET_PACKAGES),
    ...options,
  });
}
