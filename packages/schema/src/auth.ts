import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  remember: z.boolean().optional(),
});

export type LoginDTO = z.infer<typeof loginSchema>;

export const mfaVerifySchema = z.object({
  token: z.string().length(6, "MFA token must be exactly 6 digits"),
});

export type MfaVerifyDTO = z.infer<typeof mfaVerifySchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(12, "New password must be at least 12 characters long")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordDTO = z.infer<typeof changePasswordSchema>;

export const mfaResetVerifySchema = z.object({
  code: z.string().length(6, "Reset code must be 6 digits"),
});

export type MfaResetVerifyDTO = z.infer<typeof mfaResetVerifySchema>;

export const disableMfaSchema = z.object({
  password: z.string().min(1, "Password is required to disable MFA"),
});

export type DisableMfaDTO = z.infer<typeof disableMfaSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
});

export type ForgotPasswordDTO = z.infer<typeof forgotPasswordSchema>;

export const verifyOtpSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  otp: z.string().length(6, "Verification code must be 6 digits"),
});

export type VerifyOtpDTO = z.infer<typeof verifyOtpSchema>;

export const resetPasswordWithTokenSchema = z
  .object({
    email: z
      .string()
      .email("Please enter a valid email address")
      .optional(),
    resetToken: z.string().min(1, "Reset token is required"),
    newPassword: z
      .string()
      .min(12, "New password must be at least 12 characters long")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordWithTokenDTO = z.infer<typeof resetPasswordWithTokenSchema>;

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  fullName: z.string(),
  roleName: z.string(),
  tenantId: z.string().optional().nullable(),
  branchIds: z.array(z.string()).optional(),
  activeBranchId: z.string().optional().nullable(),
  mfaVerified: z.boolean().optional(),
  avatarUrl: z.string().nullable().optional(),
  organizationName: z.string().nullable().optional(),
  organizationContactName: z.string().nullable().optional(),
});

export type AuthUserDTO = z.infer<typeof authUserSchema>;

export const switchBranchSchema = z.object({
  branchId: z.string().min(1, "branchId is required"),
});

export type SwitchBranchDTO = z.infer<typeof switchBranchSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

export type RefreshTokenDTO = z.infer<typeof refreshTokenSchema>;

export const loginResponseSchema = z.object({
  success: z.boolean().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  user: authUserSchema.optional(),
  requiresMfa: z.boolean().optional(),
  message: z.string().optional(),
});

export type LoginResponseDTO = z.infer<typeof loginResponseSchema>;
