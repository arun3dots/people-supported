import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { CREATE_CARE_NOTE } from "@repo/endpoints";
import { residentKeys } from "./keys";
import { CreateCareNoteDTO } from "@repo/schema";
import { toast } from "@repo/ui/components/ui";

export function useCreateCareNoteMutation(residentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCareNoteDTO) =>
      makeAPICall(CREATE_CARE_NOTE, data, {}, { id: residentId }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Care note recorded successfully",
      });
      queryClient.invalidateQueries({
        queryKey: residentKeys.timeline(residentId),
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record care note",
        variant: "destructive",
      });
    },
  });
}
