import { useMutation } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { UPLOAD_ADMISSION_PHOTO } from "@repo/endpoints";
import { toast } from "@repo/ui/components/ui";

export function useUploadAdmissionPhotoMutation() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      return makeAPICall<{ success: boolean; photoUrl: string; fileUrl: string }>(
        UPLOAD_ADMISSION_PHOTO,
        formData,
      );
    },
    onSuccess: () => {
      toast({
        title: "Photo Uploaded",
        description: "Profile photo uploaded via AWS S3 storage successfully.",
      });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "Failed to upload photo to storage";
      toast({
        title: "Upload Failed",
        description: msg,
        variant: "destructive",
      });
    },
  });
}
