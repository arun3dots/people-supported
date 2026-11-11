import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { UPDATE_ENQUIRY } from "@repo/endpoints";
import { UpdateEnquiryAssessmentDTO, EnquiryResponseDTO } from "@repo/schema";
import { toast } from "@repo/ui/components/ui";

export function useUpdateEnquiryMutation(id: string, options?: { silent?: boolean }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateEnquiryAssessmentDTO) =>
      makeAPICall<EnquiryResponseDTO>(
        UPDATE_ENQUIRY,
        data as Record<string, unknown>,
        {},
        { id }
      ),
    onSuccess: async () => {
      if (!options?.silent) {
        toast({
          title: "Success",
          description: "Enquiry updated successfully",
        });
      }
      // Refetch immediately so the table reflects the latest state
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["enquiries"] }),
        queryClient.refetchQueries({ queryKey: ["enquiry", id] }),
      ]);
    },
    onError: (error: Error) => {
      if (!options?.silent) {
        toast({
          title: "Error",
          description: error?.message || "Failed to update enquiry",
          variant: "destructive",
        });
      }
    },
  });
}
