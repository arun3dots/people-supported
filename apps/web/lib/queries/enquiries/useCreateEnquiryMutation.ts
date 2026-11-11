import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { CREATE_ENQUIRY } from "@repo/endpoints";
import {
  CreateEnquiryDraftDTO,
  CreateEnquiryStage1DTO,
  EnquiryResponseDTO,
} from "@repo/schema";
import { toast } from "@repo/ui/components/ui";

export function useCreateEnquiryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEnquiryStage1DTO | CreateEnquiryDraftDTO) =>
      makeAPICall<EnquiryResponseDTO>(CREATE_ENQUIRY, data as Record<string, unknown>),
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "New enquiry created successfully",
      });
      // Use refetchQueries so the table data is always fresh (not deferred)
      await queryClient.refetchQueries({ queryKey: ["enquiries"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create enquiry",
        variant: "destructive",
      });
    },
  });
}
