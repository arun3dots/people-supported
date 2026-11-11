import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_TENANTS } from "../../endpoints";
import type { Tenant } from "../../types/tenant";

export function useGetTenantsQuery(
  options?: Partial<UseQueryOptions<Tenant[]>>,
) {
  return useQuery({
    queryKey: [GET_TENANTS],
    queryFn: async () => makeAPICall<Tenant[]>(GET_TENANTS),
    ...options,
  });
}
