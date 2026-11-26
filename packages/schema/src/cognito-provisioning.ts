import { z } from "zod";

export const createManagedAccountSchema = z
  .object({
    requestId: z.string().uuid(),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((email) => email.toLowerCase()),
    fullName: z.string().trim().min(2).max(150),
    roleId: z.string().trim().min(1).max(128),
    branchId: z.string().uuid(),
  })
  .strict();

export const managedAccountActionSchema = z
  .object({
    action: z.enum(["resend", "retry", "disable", "enable", "reset-password"]),
  })
  .strict();

export const managedAccountVerificationSchema = z
  .object({
    token: z.string().regex(/^[a-zA-Z0-9_-]{43}$/),
  })
  .strict();

export const managedAccountStatusSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  active: z.boolean(),
  phase: z.enum([
    "VerifyEmail",
    "ProvisionIdentity",
    "Invite",
    "Invited",
    "Activated",
  ]),
  verificationDelivery: z.enum(["NotSent", "Sending", "Sent", "Failed"]),
  invitationDelivery: z.enum(["NotSent", "Sending", "Sent", "Failed"]),
  lastError: z.string().nullable(),
});

export const managedAccountDirectorySchema = z.object({
  accounts: z.array(managedAccountStatusSchema),
  roles: z.array(z.object({ id: z.string(), name: z.string() })),
  branches: z.array(z.object({ id: z.string(), name: z.string() })),
});

export type ManagedAccountDirectoryDTO = z.infer<
  typeof managedAccountDirectorySchema
>;

export type CreateManagedAccountDTO = z.infer<
  typeof createManagedAccountSchema
>;
export type ManagedAccountActionDTO = z.infer<
  typeof managedAccountActionSchema
>;
export type ManagedAccountVerificationDTO = z.infer<
  typeof managedAccountVerificationSchema
>;
export type ManagedAccountStatusDTO = z.infer<
  typeof managedAccountStatusSchema
>;
