import { useQuery, UseQueryOptions, keepPreviousData } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_STAFF } from "@repo/endpoints";
import { StaffMember } from "../../types/staff";
import type { StaffListQueryInput, PaginatedResponse } from "@repo/schema";
import { toQueryParams } from "../../utils/queryParams";

export type PaginatedStaffResponse = PaginatedResponse<StaffMember>;

/**
 * Every staff member as a flat array, for dropdowns, pickers, rota grids and
 * KPI cards. Sends `all=true`, so it is NOT affected by list pagination.
 * For the paginated directory table use {@link useGetPaginatedStaffQuery}.
 */
export function useGetStaffQuery(
  options?: Partial<UseQueryOptions<StaffMember[]>>,
) {
  const params: StaffListQueryInput = { all: true };

  return useQuery({
    queryKey: [GET_STAFF, params],
    queryFn: async () => {
      const res = await makeAPICall<
        PaginatedStaffResponse | StaffMember[]
      >(GET_STAFF, {}, toQueryParams(params));
      // Tolerate a bare array in case an older backend is deployed.
      return Array.isArray(res) ? res : res?.data ?? [];
    },
    ...options,
  });
}

/** One page of staff plus the pagination envelope (total, totalPages, ...). */
export function useGetPaginatedStaffQuery(
  params: StaffListQueryInput = { page: 1, limit: 10 },
  options?: Partial<UseQueryOptions<PaginatedStaffResponse>>,
) {
  return useQuery({
    queryKey: [GET_STAFF, "paginated", params],
    queryFn: async () =>
      makeAPICall<PaginatedStaffResponse>(
        GET_STAFF,
        {},
        toQueryParams(params),
      ),
    // Keep the previous page visible while the next one loads.
    placeholderData: keepPreviousData,
    ...options,
  });
}
