import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { ADMINISTER_MEDICATION } from "@repo/endpoints";
import { residentKeys } from "./keys";
import { toast } from "@repo/ui/components/ui";

interface AdministerMedicationPayload {
  roundId: string;
  status: "Given" | "Refused" | "Not Available";
  reason?: string;
  residentId: string;
  vitals?: any;
}

export function useAdministerMedicationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdministerMedicationPayload) =>
      makeAPICall(
        ADMINISTER_MEDICATION,
        payload as unknown as Record<string, unknown>,
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          ...residentKeys.detail(variables.residentId),
          "medication-rounds",
        ],
      });
      toast({
        title: "Success",
        description: "Medication administration recorded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.message || "Failed to record medication administration",
        variant: "destructive",
      });
    },
  });
}
