import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { DELETE_CARE_NOTE } from "@repo/endpoints";
import { residentKeys } from "./keys";
import { toast } from "@repo/ui/components/ui";

export function useDeleteCareNoteMutation(residentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteId: string) =>
      makeAPICall(DELETE_CARE_NOTE, {}, {}, { id: residentId, noteId }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Care note deleted successfully",
      });
      queryClient.invalidateQueries({
        queryKey: residentKeys.timeline(residentId),
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete care note",
        variant: "destructive",
      });
    },
  });
}

