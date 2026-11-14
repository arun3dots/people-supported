import { useQuery } from "@tanstack/react-query";
import { GET_RESIDENT_ONBOARDING_MEDICINES } from "@repo/endpoints";
import type { PreAdmissionPartCDTO } from "@repo/schema";
import { makeAPICall } from "../../api";
import { residentKeys } from "./keys";

export function useGetResidentOnboardingMedicinesQuery(residentId: string) {
  return useQuery({
    queryKey: [
      ...residentKeys.detail(residentId),
      "medication-rounds",
      "onboarding",
    ],
    queryFn: () =>
      makeAPICall<PreAdmissionPartCDTO["medicines"]>(
        GET_RESIDENT_ONBOARDING_MEDICINES,
        {},
        {},
        { id: residentId },
      ),
    enabled: Boolean(residentId),
    refetchInterval: 30_000,
  });
}
