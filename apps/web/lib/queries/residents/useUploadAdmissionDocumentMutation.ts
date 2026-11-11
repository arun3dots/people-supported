import { useMutation } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { UPLOAD_ADMISSION_DOCUMENT } from "@repo/endpoints";
import { toast } from "@repo/ui/components/ui";

export interface UploadAdmissionDocumentResponse {
  success: boolean;
  documentUrl: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export function useUploadAdmissionDocumentMutation() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      return makeAPICall<UploadAdmissionDocumentResponse>(
        UPLOAD_ADMISSION_DOCUMENT,
        formData,
      );
    },
    onSuccess: (data) => {
      toast({
        title: "Document Uploaded",
        description: `${data.fileName || "File"} uploaded to secure storage successfully.`,
      });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "Failed to upload document";
      toast({
        title: "Upload Failed",
        description: msg,
        variant: "destructive",
      });
    },
  });
}
