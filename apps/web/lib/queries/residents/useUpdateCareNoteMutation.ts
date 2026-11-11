import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { UPDATE_CARE_NOTE } from "@repo/endpoints";
import { residentKeys } from "./keys";
import { UpdateCareNoteDTO } from "@repo/schema";
import { toast } from "@repo/ui/components/ui";

export function useUpdateCareNoteMutation(residentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, data }: { noteId: string; data: UpdateCareNoteDTO }) =>
      makeAPICall(UPDATE_CARE_NOTE, data, {}, { id: residentId, noteId }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Care note updated successfully",
      });
      queryClient.invalidateQueries({
        queryKey: residentKeys.timeline(residentId),
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update care note",
        variant: "destructive",
      });
    },
  });
}

