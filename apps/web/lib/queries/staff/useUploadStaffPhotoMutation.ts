import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import { UPLOAD_STAFF_PHOTO, GET_STAFF_MEMBER, GET_STAFF } from "@repo/endpoints";

export function useUploadStaffPhotoMutation(staffId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return makeAPICall<{ photoUrl: string }>(
        UPLOAD_STAFF_PHOTO,
        formData,
        {},
        { id: staffId }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GET_STAFF_MEMBER, staffId] });
      queryClient.invalidateQueries({ queryKey: [GET_STAFF] });
    },
  });
}
