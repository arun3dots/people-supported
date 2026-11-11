import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_ORGANIZATION_PROFILE } from "@repo/endpoints";

export function useGetOrganizationProfileQuery(
  options?: Partial<UseQueryOptions<any>>,
) {
  return useQuery({
    queryKey: [GET_ORGANIZATION_PROFILE],
    queryFn: async () => {
      return await makeAPICall<any>(GET_ORGANIZATION_PROFILE);
    },
    ...options,
  });
}
