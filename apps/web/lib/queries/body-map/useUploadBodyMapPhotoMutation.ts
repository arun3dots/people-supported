"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { UPLOAD_BODY_MAP_PHOTO } from "@repo/endpoints";
import { bodyMapKeys } from "./keys";
import { toast } from "@repo/ui/components/ui";

export function useUploadBodyMapPhotoMutation(residentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      findingId,
      file,
    }: {
      findingId: string;
      file: File;
    }) => {
      const formData = new FormData();
      formData.append("file", file);

      return makeAPICall(
        UPLOAD_BODY_MAP_PHOTO,
        formData,
        {},
        { id: findingId },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: bodyMapKeys.assessments(residentId),
      });
      toast({
        title: "Photo Uploaded",
        description: "Photo has been attached to the finding",
      });
    },
    onError: (error: Record<string, unknown>) => {
      toast({
        title: "Error",
        description:
          (error.message as string) || "Failed to upload photo",
      });
    },
  });
}
