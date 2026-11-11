import { useQuery, useMutation, UseQueryOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_PUBLIC_PACKAGES, ONBOARD_TENANT } from "@repo/endpoints";
import type { PublicOnboardingDTO } from "@repo/schema";

export interface PublicPackage {
  id: string;
  name: string;
  priceMonthly: number;
  currency: string;
  residentLimit: number;
  staffLimit: number;
}

export interface OnboardResult {
  tenantId: string;
  subdomain: string;
  paymentUrl?: string;
  paymentToken?: string;
}

export function useGetPublicPackagesQuery(
  options?: Partial<UseQueryOptions<PublicPackage[]>>,
) {
  return useQuery({
    queryKey: [GET_PUBLIC_PACKAGES],
    queryFn: async () => makeAPICall<PublicPackage[]>(GET_PUBLIC_PACKAGES),
    ...options,
  });
}

export function useOnboardMutation() {
  return useMutation({
    mutationFn: async (payload: PublicOnboardingDTO) =>
      makeAPICall<OnboardResult>(
        ONBOARD_TENANT,
        payload as unknown as Record<string, unknown>,
      ),
  });
}
