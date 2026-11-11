import { useQuery, UseQueryOptions, keepPreviousData } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_ROOMS } from "@repo/endpoints";
import { Room } from "../../types/facility";
import type { RoomListQueryInput, PaginatedResponse } from "@repo/schema";
import { toQueryParams } from "../../utils/queryParams";

export type PaginatedRoomResponse = PaginatedResponse<Room>;

/**
 * Every room (optionally scoped to one wing) as a flat array, for dropdowns,
 * the admission wizard and bed allocation. Sends `all=true`, so it is NOT
 * affected by list pagination. For the Rooms tab use
 * {@link useGetPaginatedRoomsQuery}.
 */
export function useGetRoomsQuery(
  wingId?: string | null,
  options?: Partial<UseQueryOptions<Room[]>>,
) {
  const params: RoomListQueryInput = { all: true, ...(wingId ? { wingId } : {}) };

  return useQuery({
    queryKey: [GET_ROOMS, params],
    queryFn: async () => {
      const res = await makeAPICall<PaginatedRoomResponse | Room[]>(
        GET_ROOMS,
        {},
        toQueryParams(params),
      );
      return Array.isArray(res) ? res : res?.data ?? [];
    },
    ...options,
  });
}

/** One page of rooms plus the pagination envelope. */
export function useGetPaginatedRoomsQuery(
  params: RoomListQueryInput = { page: 1, limit: 10 },
  options?: Partial<UseQueryOptions<PaginatedRoomResponse>>,
) {
  return useQuery({
    queryKey: [GET_ROOMS, "paginated", params],
    queryFn: () =>
      makeAPICall<PaginatedRoomResponse>(GET_ROOMS, {}, toQueryParams(params)),
    placeholderData: keepPreviousData,
    ...options,
  });
}
