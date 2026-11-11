import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { UPDATE_PROFILE, UPLOAD_PROFILE_IMAGE } from "@repo/endpoints";
import { UpdateProfileDTO } from "@repo/schema";

export function useUpdateProfileMutation(
  options?: UseMutationOptions<any, Error, UpdateProfileDTO>,
) {
  return useMutation({
    mutationFn: async (payload: UpdateProfileDTO) => {
      return await makeAPICall<any>(UPDATE_PROFILE, payload as any);
    },
    ...options,
  });
}

export function useUploadProfileImageMutation(
  options?: UseMutationOptions<any, Error, File>,
) {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      // Depending on the makeAPICall implementation, FormData might need to be passed differently.
      // Assuming it accepts payload:
      return await makeAPICall<any>(UPLOAD_PROFILE_IMAGE, formData as any);
    },
    ...options,
  });
}
