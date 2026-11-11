import { useMutation } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { UPLOAD_MEDICATION_IMAGE } from "@repo/endpoints";
import { toast } from "@repo/ui/components/ui";

export function useUploadMedicationImageMutation() {
  return useMutation({
    mutationFn: async ({
      residentId,
      file,
    }: {
      residentId: string;
      file: File;
    }) => {
      const formData = new FormData();
      formData.append("file", file);

      return makeAPICall<{
        success: boolean;
        imageUrl: string;
        fileUrl: string;
      }>(UPLOAD_MEDICATION_IMAGE, formData, {}, { id: residentId });
    },
    onError: (error: unknown) => {
      const rawMsg = error instanceof Error ? error.message : "";
      const isSizeError =
        rawMsg.toLowerCase().includes("large") ||
        rawMsg.toLowerCase().includes("limit") ||
        rawMsg.toLowerCase().includes("size") ||
        rawMsg.includes("413");

      const title = isSizeError ? "File too large" : "Upload Failed";
      const description = isSizeError
        ? "Photo must be smaller than 5MB."
        : rawMsg || "Failed to upload medication image.";

      toast({
        title,
        description,
        variant: "destructive",
      });
    },
  });
}
