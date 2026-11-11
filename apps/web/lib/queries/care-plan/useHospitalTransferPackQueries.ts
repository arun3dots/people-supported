import { useQuery } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { GET_HOSPITAL_TRANSFER_PACK } from "@repo/endpoints";
import { HospitalTransferPackDTO } from "@repo/schema";
import { carePlanKeys } from "./keys";

export function useGetHospitalTransferPackQuery(residentId: string, enabled = true) {
  return useQuery({
    queryKey: carePlanKeys.transferPack(residentId),
    queryFn: () =>
      makeAPICall<HospitalTransferPackDTO>(
        GET_HOSPITAL_TRANSFER_PACK,
        undefined,
        {},
        { residentId }
      ),
    enabled: !!residentId && enabled,
  });
}
