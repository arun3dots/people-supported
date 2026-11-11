import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { UPLOAD_RESIDENT_PHOTO } from "@repo/endpoints";
import { toast } from "@repo/ui/components/ui";
import { residentKeys } from "./keys";

export function useUploadResidentPhotoMutation(residentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      // Signature: makeAPICall(KEY, payload, params, substitutions).
      // The file is the FormData payload; `[id]` in the endpoint path is filled
      // via the substitutions arg. (Previously these were passed as a single
      // object payload, so the file was dropped and `[id]` never substituted.)
      return makeAPICall(
        UPLOAD_RESIDENT_PHOTO,
        formData,
        {},
        { id: residentId },
      );
    },
    onSuccess: () => {
      // Refresh the resident detail cache so the new photo renders immediately
      queryClient.invalidateQueries({
        queryKey: residentKeys.detail(residentId),
      });
      toast({
        title: "Success",
        description: "Profile photo updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload photo",
      });
    },
  });
}
