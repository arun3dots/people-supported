import { z } from "zod";
import { paginationQuerySchema, queryBoolean } from "./common/pagination";

/**
 * List query for a user's own notification feed. `page`/`limit`/`search`/
 * `sortOrder`/`all` come from {@link paginationQuerySchema}; `search` matches
 * the notification title and message.
 */
export const notificationListQuerySchema = paginationQuerySchema.extend({
  isRead: queryBoolean.optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
});

/** Parsed shape the controller receives (defaults applied). */
export type NotificationListQueryDTO = z.infer<typeof notificationListQuerySchema>;
/** Un-parsed shape web callers may send (accepts `isRead=true` from a URL). */
export type NotificationListQueryInput = z.input<
  typeof notificationListQuerySchema
>;

export const RegisterDeviceTokenSchema = z.object({
  token: z.string().min(1, "Device token is required"),
  platform: z.enum(["expo", "ios", "android", "web"]),
  deviceName: z.string().optional(),
});

export type RegisterDeviceTokenDTO = z.infer<typeof RegisterDeviceTokenSchema>;

export const PushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});
export type PushSubscriptionDTO = z.infer<typeof PushSubscriptionSchema>;

export const UpdateNotificationPreferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  webEnabled: z.boolean().optional(),
});
export type UpdateNotificationPreferencesDTO = z.infer<
  typeof UpdateNotificationPreferencesSchema
>;

