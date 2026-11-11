import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_ENQUIRIES } from "@repo/endpoints";
import type {
  EnquiryResponseDTO,
  EnquiryListQueryInput,
  PaginatedResponse,
} from "@repo/schema";
import { toQueryParams } from "../../utils/queryParams";

export type PaginatedEnquiryResponse = PaginatedResponse<EnquiryResponseDTO>;

export interface EnquiryFilters {
  search?: string;
  status?: string;
  careCategory?: string;
}

/**
 * Every enquiry as a flat array, for pickers and the admission wizard pre-fill.
 * Sends `all=true`, so it is NOT affected by list pagination.
 */
export function useGetEnquiriesQuery(filters: EnquiryFilters = {}) {
  const params: EnquiryListQueryInput = { ...filters, all: true };

  return useQuery({
    queryKey: ["enquiries", params],
    queryFn: async () => {
      const res = await makeAPICall<
        PaginatedEnquiryResponse | EnquiryResponseDTO[]
      >(GET_ENQUIRIES, {}, toQueryParams(params));
      return Array.isArray(res) ? res : res?.data ?? [];
    },
    placeholderData: keepPreviousData,
  });
}

/** One page of enquiries plus the pagination envelope. */
export function useGetPaginatedEnquiriesQuery(
  params: EnquiryListQueryInput = { page: 1, limit: 10 },
) {
  return useQuery({
    queryKey: ["enquiries", "paginated", params],
    queryFn: () =>
      makeAPICall<PaginatedEnquiryResponse>(
        GET_ENQUIRIES,
        {},
        toQueryParams(params),
      ),
    placeholderData: keepPreviousData,
  });
}
