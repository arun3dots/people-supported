import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { ADMINISTER_MEDICATION } from "@repo/endpoints";
import type { AdministerMedicationDTO } from "@repo/schema";
import { refreshMedicationQueries } from "./refreshMedicationQueries";
import { toast } from "@repo/ui/components/ui";

type AdministerMedicationPayload = Omit<AdministerMedicationDTO, "status"> & {
  status: AdministerMedicationDTO["status"] | "Not Available";
};

export function useAdministerMedicationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdministerMedicationPayload) =>
      makeAPICall(ADMINISTER_MEDICATION, {
        ...payload,
        status: payload.status === "Not Available" ? "Omitted" : payload.status,
      }),
    onSuccess: async (_, variables) => {
      await refreshMedicationQueries(queryClient, variables.residentId);
      toast({
        title: "Success",
        description: "Medication administration recorded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description:
          error.message || "Failed to record medication administration",
        variant: "destructive",
      });
    },
  });
}
