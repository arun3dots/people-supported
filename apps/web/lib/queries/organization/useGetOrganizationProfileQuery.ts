import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_ORGANIZATION_PROFILE } from "@repo/endpoints";

export interface OrganizationProfileData {
  id: string;
  name: string;
  subdomain: string;
  cqcNumber?: string | null;
  cqcProviderId?: string | null;
  cqcLocationId?: string | null;
  careHomeType?: string | null;
  registeredProvider?: string | null;
  establishedDate?: string | null;
  website?: string | null;
  status: string;
  packageId?: string | null;
  package?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  postcode?: string | null;
  primaryContactEmail?: string | null;
  primaryContactName?: string | null;
  primaryContactPhone?: string | null;
  primaryContactRole?: string | null;
  logoUrl?: string | null;
  branches?: Array<{ id: string; name: string }>;
}

export function useGetOrganizationProfileQuery(
  options?: Partial<UseQueryOptions<OrganizationProfileData>>,
) {
  return useQuery({
    queryKey: [GET_ORGANIZATION_PROFILE],
    queryFn: async () => {
      return await makeAPICall<OrganizationProfileData>(GET_ORGANIZATION_PROFILE);
    },
    ...options,
  });
}
