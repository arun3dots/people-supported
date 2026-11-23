import { useQuery } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_RESIDENT_MEDICATION_ROUNDS } from "@repo/endpoints";
import { residentKeys } from "./keys";
import type { MedicationRoundRow } from "./useGetMedicationPrescriptionsQuery";

export function useGetResidentMedicationRoundsQuery(residentId: string) {
  return useQuery({
    queryKey: [...residentKeys.detail(residentId), "medication-rounds"],
    queryFn: () =>
      makeAPICall<MedicationRoundRow[]>(
        GET_RESIDENT_MEDICATION_ROUNDS,
        {},
        {},
        { id: residentId },
      ),
    enabled: !!residentId,
    refetchInterval: 30_000,
  });
}
