import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { ASSIGN_BED, GET_BEDS, GET_ROOMS } from "@repo/endpoints";
import { residentKeys } from "./keys";
import { toast } from "@repo/ui/components/ui";

export function useAssignBedMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ residentId, bedId }: { residentId: string; bedId: string }) => {
      return makeAPICall(ASSIGN_BED, { bedId }, {}, { id: residentId });
    },
    onSuccess: () => {
      toast({
        title: "Bed Assigned",
        description: "Resident has been assigned to the bed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [GET_BEDS] });
      queryClient.invalidateQueries({ queryKey: [GET_ROOMS] });
      queryClient.invalidateQueries({ queryKey: residentKeys.all });
      queryClient.invalidateQueries({ queryKey: ["beds"] });
      queryClient.invalidateQueries({ queryKey: ["residents"] });
      queryClient.invalidateQueries({ queryKey: ["facility"] });
      queryClient.invalidateQueries({ queryKey: ["facility-stats"] });
    },
    onError: (err: { message?: string }) => {
      toast({
        title: "Assignment Failed",
        description: err?.message || "Failed to assign resident to bed.",
        variant: "destructive",
      });
    },
  });
}
