import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { makeAPICall } from "../../api";
import {
  CHANGE_PASSWORD,
  FORGOT_PASSWORD,
  VERIFY_OTP,
  RESET_PASSWORD_OTP,
  RESEND_VERIFICATION,
} from "@repo/endpoints";
import {
  ChangePasswordDTO,
  ForgotPasswordDTO,
  VerifyOtpDTO,
  ResetPasswordWithTokenDTO,
} from "@repo/schema";

export function useChangePasswordMutation(
  options?: UseMutationOptions<any, Error, ChangePasswordDTO>,
) {
  return useMutation({
    mutationFn: async (payload: ChangePasswordDTO) =>
      makeAPICall<any>(CHANGE_PASSWORD, payload as any),
    ...options,
  });
}

export function useForgotPasswordMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, ForgotPasswordDTO>,
) {
  return useMutation({
    mutationFn: async (payload: ForgotPasswordDTO) =>
      makeAPICall<{ success: boolean }>(FORGOT_PASSWORD, payload as any),
    ...options,
  });
}

export function useVerifyOtpMutation(
  options?: UseMutationOptions<
    { success: boolean; resetToken: string },
    Error,
    VerifyOtpDTO
  >,
) {
  return useMutation({
    mutationFn: async (payload: VerifyOtpDTO) =>
      makeAPICall<{ success: boolean; resetToken: string }>(
        VERIFY_OTP,
        payload as any,
      ),
    ...options,
  });
}

export function useResetPasswordMutation(
  options?: UseMutationOptions<
    { success: boolean },
    Error,
    ResetPasswordWithTokenDTO
  >,
) {
  return useMutation({
    mutationFn: async (payload: ResetPasswordWithTokenDTO) =>
      makeAPICall<{ success: boolean }>(RESET_PASSWORD_OTP, payload as any),
    ...options,
  });
}

export function useResendVerificationMutation(
  options?: UseMutationOptions<
    { success: boolean; alreadyVerified?: boolean },
    Error
  >,
) {
  return useMutation({
    mutationFn: async () =>
      makeAPICall<{ success: boolean; alreadyVerified?: boolean }>(
        RESEND_VERIFICATION,
        {},
      ),
    ...options,
  });
}
