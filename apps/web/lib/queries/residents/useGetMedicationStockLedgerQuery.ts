import { useQuery } from "@tanstack/react-query";
import { GET_MEDICATION_STOCK_LEDGER } from "@repo/endpoints";
import type { CreateMedicationStockTransactionDTO } from "@repo/schema";
import { makeAPICall } from "../../api";
import { residentKeys } from "./keys";

/** The ledger is returned newest first; existing transaction DTO fields contain the balances. */
export function useGetMedicationStockLedgerQuery(
  residentId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      ...residentKeys.detail(residentId),
      "medication-rounds",
      "stock",
    ],
    queryFn: () =>
      makeAPICall<CreateMedicationStockTransactionDTO[]>(
        GET_MEDICATION_STOCK_LEDGER,
        {},
        {},
        { id: residentId },
      ),
    enabled: Boolean(residentId) && enabled,
    refetchInterval: 30_000,
  });
}
