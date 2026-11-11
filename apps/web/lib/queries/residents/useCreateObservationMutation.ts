import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { CREATE_OBSERVATION } from "@repo/endpoints";
import { residentKeys } from "./keys";
import { ObservationDTO } from "@repo/schema";
import { toast } from "@repo/ui/components/ui";

export function useCreateObservationMutation(residentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ObservationDTO & { news2Score: number }) =>
      makeAPICall(CREATE_OBSERVATION, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Observation recorded successfully",
      });
      queryClient.invalidateQueries({
        queryKey: residentKeys.observations(residentId),
      });
      queryClient.invalidateQueries({
        queryKey: residentKeys.timeline(residentId),
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record observation",
        variant: "destructive",
      });
    },
  });
}
