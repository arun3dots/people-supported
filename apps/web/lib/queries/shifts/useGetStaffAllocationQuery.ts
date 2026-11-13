import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { GET_STAFF_ALLOCATION } from "@repo/endpoints";
import type { StaffAllocationResponseDTO } from "@repo/schema";
import { makeAPICall } from "../../api";
import { toQueryParams } from "../../utils/queryParams";

export type StaffAllocationQueryParams = {
  from?: string;
  to?: string;
  wingId?: string;
};

export function useGetStaffAllocationQuery(
  params?: StaffAllocationQueryParams,
  options?: Partial<UseQueryOptions<StaffAllocationResponseDTO>>,
) {
  return useQuery({
    queryKey: [GET_STAFF_ALLOCATION, params],
    queryFn: async () =>
      makeAPICall<StaffAllocationResponseDTO>(
        GET_STAFF_ALLOCATION,
        {},
        params ? toQueryParams(params) : undefined,
      ),
    ...options,
  });
}

