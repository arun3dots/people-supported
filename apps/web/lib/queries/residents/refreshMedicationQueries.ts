import type { QueryClient } from "@tanstack/react-query";
import { residentKeys } from "./keys";

/** Wait for the saved medication records; unrelated stock reads must not delay saving. */
export async function refreshMedicationQueries(
  client: QueryClient,
  residentId: string,
): Promise<void> {
  const key = [...residentKeys.detail(residentId), "medication-rounds"];
  await Promise.all([
    client.invalidateQueries({ queryKey: key, exact: true }),
    client.invalidateQueries({
      queryKey: [...key, "prescriptions"],
      exact: true,
    }),
  ]);
  void client.invalidateQueries({ queryKey: [...key, "stock"], exact: true });
}
