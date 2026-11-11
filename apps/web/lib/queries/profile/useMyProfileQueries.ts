import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import {
  GET_MY_PROFILE,
  UPDATE_MY_PROFILE,
  GET_MY_COMPLIANCE,
  UPLOAD_MY_PROFILE_PHOTO,
} from "@repo/endpoints";
import { MyProfile } from "../../types/profile";
import { FullComplianceData } from "../staff/useComplianceQueries";
import { UpdateProfileDTO } from "@repo/schema";

export function useGetMyProfileQuery(
  options?: Partial<UseQueryOptions<MyProfile>>,
) {
  return useQuery({
    queryKey: [GET_MY_PROFILE],
    queryFn: () => makeAPICall<MyProfile>(GET_MY_PROFILE),
    ...options,
  });
}

export function useGetMyComplianceQuery(
  options?: Partial<UseQueryOptions<FullComplianceData>>,
) {
  return useQuery({
    queryKey: [GET_MY_COMPLIANCE],
    queryFn: () => makeAPICall<FullComplianceData>(GET_MY_COMPLIANCE),
    ...options,
  });
}

export function useUpdateMyProfileMutation(
  options?: UseMutationOptions<MyProfile, Error, UpdateProfileDTO>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfileDTO) =>
      makeAPICall<MyProfile>(
        UPDATE_MY_PROFILE,
        payload as Record<string, unknown>,
      ),
    // Spread caller options first, then our onSuccess wrapper so cache
    // invalidation always runs (and still forwards to a caller's onSuccess).
    ...options,
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: [GET_MY_PROFILE] });
      options?.onSuccess?.(...args);
    },
  });
}

export function useUploadMyProfilePhotoMutation(
  options?: UseMutationOptions<{ photoUrl: string }, Error, File>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return makeAPICall<{ photoUrl: string }>(
        UPLOAD_MY_PROFILE_PHOTO,
        formData,
      );
    },
    ...options,
    onSuccess: (...args) => {
      const data = args[0];
      if (data?.photoUrl) {
        qc.setQueryData<MyProfile | undefined>([GET_MY_PROFILE], (old) =>
          old ? { ...old, profilePhotoUrl: data.photoUrl } : old,
        );
      }
      qc.invalidateQueries({ queryKey: [GET_MY_PROFILE] });
      options?.onSuccess?.(...args);
    },
  });
}


