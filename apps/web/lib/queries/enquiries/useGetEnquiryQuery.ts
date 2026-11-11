import { useQuery } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_ENQUIRY } from "@repo/endpoints";
import { EnquiryResponseDTO } from "@repo/schema";

export function useGetEnquiryQuery(id?: string) {
  return useQuery({
    queryKey: ["enquiry", id],
    queryFn: () =>
      id ? makeAPICall<EnquiryResponseDTO>(GET_ENQUIRY, {}, {}, { id }) : null,
    enabled: Boolean(id),
  });
}
