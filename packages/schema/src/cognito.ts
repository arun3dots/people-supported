import { z } from "zod";

export const COGNITO_APP_ISSUER = "urn:cantracare:supported-living";
export const COGNITO_APP_AUDIENCE = "cantracare:supported-living:web";

export const sessionLogoutSchema = z.object({
  success: z.literal(true),
  signOutUrl: z.string().url().optional(),
});
export type SessionLogoutDTO = z.infer<typeof sessionLogoutSchema>;

/** Delivered by a trusted service integration. Times are UTC with milliseconds. */
export const globalIdentityRevocationSchema = z
  .object({
    version: z.literal(1),
    issuer: z.string().url().max(512),
    subject: z.string().min(1).max(255),
    revokedBefore: z.string().datetime(),
  })
  .strict();

export type GlobalIdentityRevocation = z.infer<
  typeof globalIdentityRevocationSchema
>;
