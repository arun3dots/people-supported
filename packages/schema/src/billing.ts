import { z } from "zod";

/** Shared subscription package field definitions. */
export const packageBaseSchema = z.object({
  name: z.string().min(2, "Package name must be at least 2 characters"),
  priceMonthly: z.number().nonnegative("Price cannot be negative"),
  residentLimit: z.number().int().positive("Resident limit must be positive"),
  staffLimit: z.number().int().positive("Staff limit must be positive"),
  featureFlags: z.record(z.string(), z.unknown()).default({}),
  currency: z.string().default("INR"),
});

/** SuperAdmin: create a public subscription package. */
export const createPackageSchema = packageBaseSchema.extend({
  isPublic: z.boolean().default(true),
});

/** SuperAdmin: update a subscription package (partial). */
export const updatePackageSchema = createPackageSchema.partial().extend({
  isActive: z.boolean().optional(),
});

/**
 * Custom (tenant-specific) package definition embedded in the SuperAdmin
 * tenant-create flow. Has no `isPublic` — it is always created hidden.
 */
export const customPackageSchema = packageBaseSchema;

/** Mark a payment as paid (manual / SuperAdmin override). */
export const markPaidSchema = z.object({
  paymentId: z.string().min(1),
});

/** Tenant Admin selects (or switches to) a public subscription package. */
export const selectPackageSchema = z.object({
  packageId: z.string().min(1),
});

export type CreatePackageDTO = z.infer<typeof createPackageSchema>;
export type UpdatePackageDTO = z.infer<typeof updatePackageSchema>;
export type CustomPackageDTO = z.infer<typeof customPackageSchema>;
export type MarkPaidDTO = z.infer<typeof markPaidSchema>;
export type SelectPackageDTO = z.infer<typeof selectPackageSchema>;

/**
 * Payload sent by the frontend after the Razorpay.js modal calls its
 * success handler. The backend verifies the HMAC and then activates the
 * subscription via the existing activatePayment() method.
 */
export const verifyRazorpayPaymentSchema = z.object({
  /** Razorpay order_id — matches Payment.providerOrderId. */
  orderId: z.string().min(1),
  /** razorpay_payment_id returned by the Razorpay.js handler. */
  paymentId: z.string().min(1),
  /** razorpay_signature returned by the Razorpay.js handler. */
  signature: z.string().min(1),
  /** Our own Payment.token used to look up the Payment row. */
  paymentToken: z.string().min(1),
});
export type VerifyRazorpayPaymentDTO = z.infer<typeof verifyRazorpayPaymentSchema>;
