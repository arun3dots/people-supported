import { useQuery } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_ORGANIZATION_DOCUMENTS } from "@repo/endpoints";
import { TenantDocumentDTO } from "@repo/schema";

export function useGetOrganizationDocumentsQuery() {
  return useQuery({
    queryKey: [GET_ORGANIZATION_DOCUMENTS],
    queryFn: async () => {
      return await makeAPICall<TenantDocumentDTO[]>(GET_ORGANIZATION_DOCUMENTS);
    },
  });
}
